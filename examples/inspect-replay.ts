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
  type MatchStart,
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

function playerLabel(matchStart: MatchStart, port: PortIndex): string {
  const name = matchStart.playerNames[port];
  return name.length > 0 ? name : `Port ${port + 1}`;
}

/**
 * `stocksRemaining`/`MatchResult.placements` are 0-based (see
 * docs/RMGR_SPEC.md: "0 means still on your last stock", not "0 stocks
 * left"). `-1` in `placements` specifically means "not seated at match
 * end", which covers two different real situations this function
 * distinguishes: a port that never played this match at all, and a port
 * that WAS eliminated (its last stock was taken) - both read the same -1
 * in the raw field.
 */
function humanStocks(placement: number, wasSeated: boolean): string {
  if (placement >= 0) {
    const stocks = placement + 1;
    return `${stocks} stock${stocks === 1 ? "" : "s"} remaining`;
  }
  return wasSeated ? "eliminated" : "n/a (didn't play)";
}

/** Winner by MatchResult.placements - only present for a smash64-family file. */
function determineWinner(replay: Replay): string {
  const seatedPorts = getSeatedPorts(replay);
  if (seatedPorts.length < 2) {
    return "n/a (fewer than 2 ports recorded)";
  }
  if (!replay.matchResult) {
    return "n/a (core-only file - no smash64 result data)";
  }

  const placements = replay.matchResult.placements;
  const best = seatedPorts
    .map((port) => [port, placements[port]] as const)
    .sort((a, b) => b[1] - a[1])[0];

  if (!best) {
    return "unknown";
  }
  const [winnerPort, winnerPlacement] = best;
  return `${playerLabel(replay.matchStart, winnerPort)} (${humanStocks(winnerPlacement, true)})`;
}

async function inspectFile(path: string): Promise<void> {
  const bytes = new Uint8Array(readFileSync(path));
  const replay = await parseReplay(bytes);
  const { matchStart, matchSettings, matchEnd, matchResult } = replay;

  const durationSeconds = replay.frames.length / 60; // NTSC

  console.log(`\n=== ${path} ===`);
  console.log(
    `Format version: ${replay.header.version} | Game family: ${replay.header.gameFamily || "(unrecognized)"}`,
  );
  console.log(
    `Frames recorded: ${replay.frames.length} (~${durationSeconds.toFixed(1)}s @ 60fps)`,
  );
  console.log(
    `Compressed: ${replay.header.compressedLength} bytes (${replay.header.uncompressedLength} uncompressed)`,
  );

  if (matchSettings) {
    console.log(
      `Stage: ${stageName(matchSettings.stageId)} | Mode: ${gameTypeName(matchSettings.gameType)}`,
    );
    console.log(
      `Stocks: ${matchSettings.stockCountSetting + 1} | Time limit: ${matchSettings.timeLimitMinutes === 100 ? "infinite" : `${matchSettings.timeLimitMinutes} min`} | Damage ratio: ${matchSettings.damageRatio}%`,
    );
    console.log(
      `Teams: ${matchSettings.teamsEnabled ? "on" : "off"} | Handicap: ${matchSettings.handicapMode}`,
    );
  } else {
    console.log(
      "No smash64 match settings - this file is core-only (input-only) data.",
    );
  }

  console.log("Players:");
  for (const port of getSeatedPorts(replay)) {
    const finalStocks = matchResult
      ? humanStocks(matchResult.placements[port], true)
      : "unknown (no smash64 result data)";
    const extras: string[] = [];
    let characterLabel = "";
    if (matchSettings) {
      if (matchSettings.teamsEnabled)
        extras.push(`team ${matchSettings.portTeam[port]}`);
      if (matchSettings.handicapMode !== "off")
        extras.push(`handicap ${matchSettings.portHandicap[port]}`);
      if (matchStart.slotType[port] === "cpu")
        extras.push(`CPU level ${matchSettings.portCpuLevel[port]}`);
      characterLabel = ` — ${characterName(matchSettings.characterId[port])}`;
    }
    console.log(
      `  Port ${port + 1}: ${playerLabel(matchStart, port)}${characterLabel}` +
        ` (${matchStart.slotType[port]})${extras.length ? ` [${extras.join(", ")}]` : ""}, final: ${finalStocks}`,
    );
  }

  console.log(`Result: ${matchEnd.endReason}`);
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
  await inspectFile(file);
}
