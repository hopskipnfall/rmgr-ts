/**
 * Sample usage of @rmg-k/rmgr: prints a human-readable summary of one or
 * more .rmgr files — match metadata, duration, per-player results, winner.
 *
 * Build the package first (this imports the compiled output, not the
 * TypeScript source, the way an external consumer would), then run this
 * file directly - a recent Node (>=22.6) executes .ts natively:
 *   npm run build
 *   node examples/inspect-replay.ts path/to/file.rmgr [more files...]
 */
import { readFileSync } from "node:fs";
import {
  parseReplay,
  getSeatedPorts,
  type GameStart,
  type PortIndex,
  type Replay,
} from "../dist/index.js";

// Character name table (docs/RMGR_SPEC.md section 7.1). Deliberately kept
// out of the library itself - it's display-layer data, not part of the
// wire format - but useful enough to include here.
const CHARACTER_NAMES: Record<number, string> = {
  // Vanilla (docs/RMGR_SPEC.md section 7.1)
  0x00: "Mario",
  0x01: "Fox",
  0x02: "Donkey Kong",
  0x03: "Samus",
  0x04: "Luigi",
  0x05: "Link",
  0x06: "Yoshi",
  0x07: "Captain Falcon",
  0x08: "Kirby",
  0x09: "Pikachu",
  0x0a: "Jigglypuff",
  0x0b: "Ness",
  0x0c: "Master Hand",
  0x0d: "Metal Mario",
  0x0e: "Polygon Mario",
  0x0f: "Polygon Fox",
  0x10: "Polygon DK",
  0x11: "Polygon Samus",
  0x12: "Polygon Luigi",
  0x13: "Polygon Link",
  0x14: "Polygon Yoshi",
  0x15: "Polygon Falcon",
  0x16: "Polygon Kirby",
  0x17: "Polygon Pikachu",
  0x18: "Polygon Jigglypuff",
  0x19: "Polygon Ness",
  0x1a: "Giant DK",
  0x1b: "Random",
  // Remix fighters
  0x1d: "Falco",
  0x1e: "Ganondorf",
  0x1f: "Young Link",
  0x20: "Dr. Mario",
  0x21: "Wario",
  0x22: "Dark Samus",
  0x23: "Link (EU)",
  0x24: "Samus (JP)",
  0x25: "Ness (JP)",
  0x26: "Lucas",
  0x27: "Link (JP)",
  0x28: "Falcon (JP)",
  0x29: "Fox (JP)",
  0x2a: "Mario (JP)",
  0x2b: "Luigi (JP)",
  0x2c: "DK (JP)",
  0x2d: "Pikachu (EU)",
  0x2e: "Jigglypuff (JP)",
  0x2f: "Jigglypuff (EU)",
  0x30: "Kirby (JP)",
  0x31: "Yoshi (JP)",
  0x32: "Pikachu (JP)",
  0x33: "Samus (EU)",
  0x34: "Bowser",
  0x35: "Giga Bowser",
  0x36: "Piano",
  0x37: "Wolf",
  0x38: "Conker",
  0x39: "Mewtwo",
  0x3a: "Marth",
  0x3b: "Sonic",
  0x3c: "Sandbag",
  0x3d: "Super Sonic",
  0x3e: "Sheik",
  0x3f: "Marina",
  0x40: "King Dedede",
  0x41: "Goemon",
  0x42: "Peppy",
  0x43: "Slippy",
  0x44: "Banjo",
  0x45: "Metal Luigi",
  0x46: "Ebisumaru",
  0x47: "Dragon King",
  0x48: "Crash",
  0x49: "Peach",
  0x4a: "Roy",
  0x4b: "Dr. Luigi",
  0x4c: "Lanky Kong",
  // Remix polygons
  0x4d: "Polygon Wario",
  0x4e: "Polygon Lucas",
  0x4f: "Polygon Bowser",
  0x50: "Polygon Wolf",
  0x51: "Polygon Dr. Mario",
  0x52: "Polygon Sonic",
  0x53: "Polygon Sheik",
  0x54: "Polygon Marina",
  0x55: "Polygon Falco",
  0x56: "Polygon Ganondorf",
  0x57: "Polygon Dark Samus",
  0x58: "Polygon Marth",
  0x59: "Polygon Mewtwo",
  0x5a: "Polygon Dedede",
  0x5b: "Polygon Young Link",
  0x5c: "Polygon Goemon",
  0x5d: "Polygon Conker",
  0x5e: "Polygon Banjo",
  0x5f: "Polygon Peach",
  0x60: "Polygon Crash",
};

function characterName(id: number): string {
  return CHARACTER_NAMES[id] ?? `character 0x${id.toString(16)}`;
}

const STAGE_NAMES: Record<number, string> = {
  0x00: "Peach's Castle",
  0x01: "Sector Z",
  0x02: "Congo Jungle",
  0x03: "Planet Zebes",
  0x04: "Hyrule Castle",
  0x05: "Yoshi's Island",
  0x06: "Dream Land",
  0x07: "Saffron City",
  0x08: "Mushroom Kingdom",
  0x10: "Final Destination",
};

function stageName(id: number): string {
  return STAGE_NAMES[id] ?? `stage 0x${id.toString(16)}`;
}

function gameTypeName(gameType: number): string {
  return (
    { 1: "Time", 2: "Stock", 3: "Time + Stock" }[gameType] ??
    `unknown (${gameType})`
  );
}

function playerLabel(gameStart: GameStart, port: PortIndex): string {
  const name = gameStart.playerNames[port];
  return name.length > 0 ? name : `Port ${port + 1}`;
}

/**
 * `stocksRemaining`/`GameEnd.placements` are 0-based (see docs/RMGR_SPEC.md
 * section 4.4/4.5: "0 means still on your last stock", not "0 stocks left").
 * `-1` in `placements` specifically means "not seated at match end", which
 * covers two different real situations this function distinguishes: a port
 * that never played this match at all, and a port that WAS eliminated
 * (its last stock was taken) - both read the same -1 in the raw field.
 */
function humanStocks(placement: number, wasSeated: boolean): string {
  if (placement >= 0) {
    const stocks = placement + 1;
    return `${stocks} stock${stocks === 1 ? "" : "s"} remaining`;
  }
  return wasSeated ? "eliminated" : "n/a (didn't play)";
}

/**
 * Winner by GameEnd.placements (authoritative - see humanStocks' doc
 * comment on the -1 sentinel), falling back to the last recorded frame
 * only for a truncated file with no GameEnd event at all. Deliberately
 * does NOT cross-check against the last frame's raw stocksRemaining when
 * GameEnd is present: right at a KO, the loser's actual elimination
 * (their stock count going negative) often isn't captured before the
 * recording finalizes, so their last recorded stocksRemaining can still
 * read identically to the winner's - comparing raw values there produces
 * false "disagreements", not a real signal. action state / damage% are
 * better ad-hoc signals for that specific case, not stocksRemaining.
 */
function determineWinner(replay: Replay): string {
  const seatedPorts = getSeatedPorts(replay);
  if (seatedPorts.length < 2) {
    return "n/a (fewer than 2 ports recorded)";
  }

  if (!replay.gameEnd) {
    const lastFrame = replay.frames[replay.frames.length - 1];
    const best = seatedPorts
      .map(
        (port) =>
          [
            port,
            lastFrame?.ports[port]?.post.stocksRemaining ?? -Infinity,
          ] as const,
      )
      .sort((a, b) => b[1] - a[1])[0];
    return best && best[1] > -Infinity
      ? `${playerLabel(replay.gameStart, best[0])} (inferred from last recorded frame - file has no GameEnd event)`
      : "unknown (no GameEnd event and no frame data)";
  }

  const placements = replay.gameEnd.placements;
  const best = seatedPorts
    .map((port) => [port, placements[port]] as const)
    .sort((a, b) => b[1] - a[1])[0];

  if (!best) {
    return "unknown";
  }
  const [winnerPort, winnerPlacement] = best;
  return `${playerLabel(replay.gameStart, winnerPort)} (${humanStocks(winnerPlacement, true)})`;
}

function inspectFile(path: string): void {
  const bytes = new Uint8Array(readFileSync(path));
  const replay = parseReplay(bytes);
  const { gameStart, gameEnd } = replay;

  const durationSeconds = replay.frames.length / 60; // NTSC

  console.log(`\n=== ${path} ===`);
  console.log(
    `Format version: ${replay.header.version} | Complete: ${replay.isComplete}`,
  );
  console.log(
    `Stage: ${stageName(gameStart.stageId)} | Mode: ${gameTypeName(gameStart.gameType)}`,
  );
  console.log(
    `Stocks: ${gameStart.stockCountSetting + 1} | Time limit: ${gameStart.timeLimitMinutes === 100 ? "infinite" : `${gameStart.timeLimitMinutes} min`} | Damage ratio: ${gameStart.damageRatio}%`,
  );
  console.log(
    `Frames recorded: ${replay.frames.length} (~${durationSeconds.toFixed(1)}s @ 60fps)`,
  );
  console.log(
    `Teams: ${gameStart.teamsEnabled ? "on" : "off"} | Handicap: ${gameStart.handicapMode}`,
  );

  console.log("Players:");
  for (const port of getSeatedPorts(replay)) {
    const settings = gameStart.ports[port];
    const finalStocks = gameEnd
      ? humanStocks(gameEnd.placements[port], true)
      : "unknown (truncated recording)";
    const extras: string[] = [];
    if (gameStart.teamsEnabled) extras.push(`team ${settings.team}`);
    if (gameStart.handicapMode !== "off")
      extras.push(`handicap ${settings.handicap}`);
    if (settings.slotType === "cpu")
      extras.push(`CPU level ${settings.cpuLevel}`);
    console.log(
      `  Port ${port + 1}: ${playerLabel(gameStart, port)} — ${characterName(settings.characterId)}` +
        ` (${settings.slotType})${extras.length ? ` [${extras.join(", ")}]` : ""}, final: ${finalStocks}`,
    );
  }

  console.log(
    `Result: ${gameEnd ? gameEnd.endReason : "unknown (truncated recording)"}`,
  );
  console.log(`Winner: ${determineWinner(replay)}`);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error(
    "Usage: node examples/inspect-replay.ts <file.rmgr> [more files...]",
  );
  process.exit(1);
}
for (const file of files) {
  inspectFile(file);
}
