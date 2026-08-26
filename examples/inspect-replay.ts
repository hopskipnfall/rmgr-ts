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
  getCharacterName,
  getStageName,
  type GameStart,
  type PortIndex,
  type Replay,
} from "../dist/index.js";

function characterName(id: number): string {
  return getCharacterName(id);
}

function stageName(id: number): string {
  return getStageName(id);
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
