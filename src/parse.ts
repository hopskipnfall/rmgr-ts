import { BinaryReader } from "./binary.js";
import {
  EventCode,
  FORMAT_VERSION,
  GAME_START_APPENDED_SIZE,
  GOOD_NAME_WIDTH,
  HEADER_SIZE,
  MAGIC,
  PLAYER_NAME_WIDTH,
  POST_FRAME_APPENDED_SIZE,
  gameEndReasonFromWire,
  handicapModeFromWire,
  slotTypeFromWire,
} from "./constants.js";
import type {
  Frame,
  FramePortData,
  GameEnd,
  GameStart,
  HandicapMode,
  PortIndex,
  PortSettings,
  PostFrameUpdate,
  PreFrameUpdate,
  Replay,
  ReplayHeader,
} from "./types.js";

/** Thrown for any malformed or unparseable `.rmgr` data. */
export class ReplayParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReplayParseError";
  }
}

/** Reads four values in port order (0-3) into a tuple. */
function readPortTuple<T>(read: () => T): readonly [T, T, T, T] {
  return [read(), read(), read(), read()];
}

function parseHeader(reader: BinaryReader): ReplayHeader {
  const magic = new TextDecoder("ascii").decode(reader.readBytes(4));
  if (magic !== MAGIC) {
    throw new ReplayParseError(`bad magic bytes: expected "${MAGIC}", got "${magic}"`);
  }
  const version = reader.readU8();
  if (version !== FORMAT_VERSION) {
    throw new ReplayParseError(
      `unsupported format version ${version} - this package only reads version ${FORMAT_VERSION} ` +
        `(the header layout itself changed between versions, so this isn't just a missing-field situation)`,
    );
  }
  reader.skip(3); // reserved
  const streamLength = reader.readU32();
  const goodName = reader.readFixedUtf8String(GOOD_NAME_WIDTH);
  const recorderSchemaVersion = reader.readU32();
  const recordedAtEpochSeconds = reader.readU64();
  return { version, streamLength, goodName, recorderSchemaVersion, recordedAtEpochSeconds };
}

/** Returns a map of event code -> declared payload size. */
function parseEventPayloads(reader: BinaryReader): Map<number, number> {
  const count = reader.readU8();
  const sizes = new Map<number, number>();
  for (let i = 0; i < count; i++) {
    const code = reader.readU8();
    const size = reader.readU16();
    sizes.set(code, size);
  }
  return sizes;
}

/** The original 4-byte per-port sub-struct (docs/RMGR_SPEC.md section 4.2's `PortSettings` table) - not the full, appended-fields-merged `PortSettings` type this package exposes. */
function parseBasePortSettings(reader: BinaryReader): Omit<PortSettings, "team" | "handicap" | "cpuLevel"> {
  const slotType = slotTypeFromWire(reader.readU8());
  const characterId = reader.readU8();
  const costumeId = reader.readU8();
  const teamColor = reader.readU8();
  return { slotType, characterId, costumeId, teamColor };
}

/**
 * `declaredSize` is what this file's own `EventPayloads` event declares for
 * `GameStart` - may be `GAME_START_BASE_SIZE` (150, an older file, before
 * `team`/`handicap`/`cpuLevel`/`teamsEnabled`/`handicapMode` existed) or
 * larger. The appended fields are defaulted (not left `undefined`) when
 * absent - see their doc comments in types.ts for why treating "absent" and
 * "genuinely zero/off" as the same value here is an acceptable simplification.
 */
function parseGameStart(reader: BinaryReader, declaredSize: number): GameStart {
  const start = reader.position;
  const stageId = reader.readU8();
  const gameType = reader.readU8();
  const stockCountSetting = reader.readU8();
  const timeLimitMinutes = reader.readU8();
  const damageRatio = reader.readU8();
  const itemFrequency = reader.readU8();
  const baseSettings = readPortTuple(() => parseBasePortSettings(reader));
  const playerNames = readPortTuple(() => reader.readFixedString(PLAYER_NAME_WIDTH));

  let teamsEnabled = false;
  let handicapMode: HandicapMode = "off";
  let portTeam: readonly [number, number, number, number] = [0, 0, 0, 0];
  let portHandicap: readonly [number, number, number, number] = [0, 0, 0, 0];
  let portCpuLevel: readonly [number, number, number, number] = [0, 0, 0, 0];

  const bytesReadSoFar = reader.position - start;
  if (declaredSize - bytesReadSoFar >= GAME_START_APPENDED_SIZE) {
    teamsEnabled = reader.readU8() !== 0;
    handicapMode = handicapModeFromWire(reader.readU8());
    portTeam = readPortTuple(() => reader.readU8());
    portHandicap = readPortTuple(() => reader.readU8());
    portCpuLevel = readPortTuple(() => reader.readU8());
  }

  // Forward-compat: skip anything this parser doesn't understand yet beyond
  // what it just read, same mechanism as the top-level event loop.
  const stillUnread = declaredSize - (reader.position - start);
  if (stillUnread > 0) {
    reader.skip(stillUnread);
  }

  // portTeam/portHandicap/portCpuLevel are always exactly-4 tuples (either
  // freshly read or the [0,0,0,0] default above), so the `?? 0` below is
  // just satisfying noUncheckedIndexedAccess for a non-literal index, not a
  // real fallback for missing data.
  const mergePort = (i: 0 | 1 | 2 | 3): PortSettings => ({
    ...baseSettings[i],
    team: portTeam[i] ?? 0,
    handicap: portHandicap[i] ?? 0,
    cpuLevel: portCpuLevel[i] ?? 0,
  });
  const ports: readonly [PortSettings, PortSettings, PortSettings, PortSettings] = [
    mergePort(0),
    mergePort(1),
    mergePort(2),
    mergePort(3),
  ];

  return {
    stageId,
    gameType,
    stockCountSetting,
    timeLimitMinutes,
    damageRatio,
    itemFrequency,
    teamsEnabled,
    handicapMode,
    ports,
    playerNames,
  };
}

function parsePreFrame(reader: BinaryReader): PreFrameUpdate {
  const frame = reader.readI32();
  const port = reader.readU8() as PortIndex;
  const buttons = reader.readU16();
  const stickX = reader.readI8();
  const stickY = reader.readI8();
  return { frame, port, buttons, stickX, stickY };
}

function parsePostFrame(reader: BinaryReader, declaredSize: number): PostFrameUpdate {
  const start = reader.position;
  const frame = reader.readI32();
  const port = reader.readU8() as PortIndex;
  const characterId = reader.readU8();
  const actionStateId = reader.readU16();
  const positionX = reader.readF32();
  const positionY = reader.readF32();
  // The wire value is always exactly 1 or -1 (see docs/RMGR_SPEC.md §4.4);
  // read directly rather than deriving from a sign check, so a corrupted
  // value surfaces as-is instead of being silently coerced to 1.
  const facingDirection = reader.readI32() as 1 | -1;
  const velocityX = reader.readF32();
  const velocityY = reader.readF32();
  const damagePercent = reader.readU32();
  const stocksRemaining = reader.readI8();
  const jumpsUsed = reader.readU8();
  const grounded = reader.readU8() === 0;
  const hurtboxState = reader.readU8();
  const hitstunCounter = reader.readU16();
  const actionFrameCounter = reader.readU32();

  let comboHitCount = 0;
  let comboDamage = 0;
  const bytesReadSoFar = reader.position - start;
  if (declaredSize - bytesReadSoFar >= POST_FRAME_APPENDED_SIZE) {
    comboHitCount = reader.readU32();
    comboDamage = reader.readU32();
  }

  // Forward-compat: skip anything this parser doesn't understand yet beyond
  // what it just read, same mechanism as the top-level event loop.
  const stillUnread = declaredSize - (reader.position - start);
  if (stillUnread > 0) {
    reader.skip(stillUnread);
  }

  return {
    frame,
    port,
    characterId,
    actionStateId,
    positionX,
    positionY,
    facingDirection,
    velocityX,
    velocityY,
    damagePercent,
    stocksRemaining,
    jumpsUsed,
    grounded,
    hurtboxState,
    hitstunCounter,
    actionFrameCounter,
    comboHitCount,
    comboDamage,
  };
}

function parseGameEnd(reader: BinaryReader): GameEnd {
  const endReason = gameEndReasonFromWire(reader.readU8());
  const placements = readPortTuple(() => reader.readI8());
  return { endReason, placements };
}

interface MutableFrameEntry {
  pre?: PreFrameUpdate;
  post?: PostFrameUpdate;
}

/**
 * Parses a complete `.rmgr` file from a byte buffer.
 *
 * Tolerates a truncated file (a crash or force-quit mid-match, where the
 * header's `streamLength` was never patched from `0`): parsing simply
 * continues to end-of-buffer instead of trusting the header length, and
 * `gameEnd` comes back `null` with `isComplete: false`.
 *
 * @throws {ReplayParseError} if the magic bytes are wrong, the first event
 *   isn't `EventPayloads`, an unrecognized event code has no declared size
 *   to skip by, or a `PreFrameUpdate`/`PostFrameUpdate` pair for some
 *   frame+port is incomplete.
 */
export function parseReplay(data: Uint8Array): Replay {
  const reader = new BinaryReader(data);
  const header = parseHeader(reader);

  const streamEnd = header.streamLength > 0 ? HEADER_SIZE + header.streamLength : data.byteLength;

  const firstCode = reader.readU8();
  if (firstCode !== EventCode.EventPayloads) {
    throw new ReplayParseError(
      `expected EventPayloads (0x${EventCode.EventPayloads.toString(16)}) as the first event, ` +
        `got 0x${firstCode.toString(16)}`,
    );
  }
  const declaredSizes = parseEventPayloads(reader);

  let gameStart: GameStart | undefined;
  let gameEnd: GameEnd | null = null;
  const frameEntries = new Map<number, Map<PortIndex, MutableFrameEntry>>();

  const entryFor = (frameNumber: number, port: PortIndex): MutableFrameEntry => {
    let ports = frameEntries.get(frameNumber);
    if (!ports) {
      ports = new Map();
      frameEntries.set(frameNumber, ports);
    }
    let entry = ports.get(port);
    if (!entry) {
      entry = {};
      ports.set(port, entry);
    }
    return entry;
  };

  while (reader.position < Math.min(streamEnd, data.byteLength) && reader.hasMore()) {
    const code = reader.readU8();
    switch (code) {
      case EventCode.GameStart: {
        const declaredGameStartSize = declaredSizes.get(EventCode.GameStart);
        if (declaredGameStartSize === undefined) {
          throw new ReplayParseError("EventPayloads doesn't declare a size for GameStart");
        }
        gameStart = parseGameStart(reader, declaredGameStartSize);
        break;
      }
      case EventCode.PreFrameUpdate: {
        const pre = parsePreFrame(reader);
        entryFor(pre.frame, pre.port).pre = pre;
        break;
      }
      case EventCode.PostFrameUpdate: {
        const declaredPostFrameSize = declaredSizes.get(EventCode.PostFrameUpdate);
        if (declaredPostFrameSize === undefined) {
          throw new ReplayParseError("EventPayloads doesn't declare a size for PostFrameUpdate");
        }
        const post = parsePostFrame(reader, declaredPostFrameSize);
        entryFor(post.frame, post.port).post = post;
        break;
      }
      case EventCode.GameEnd:
        gameEnd = parseGameEnd(reader);
        break;
      default: {
        const size = declaredSizes.get(code);
        if (size === undefined) {
          throw new ReplayParseError(
            `unrecognized event code 0x${code.toString(16)} with no declared size in EventPayloads`,
          );
        }
        reader.skip(size);
        break;
      }
    }
  }

  if (!gameStart) {
    throw new ReplayParseError("file has no GameStart event");
  }

  const frameNumbers = [...frameEntries.keys()].sort((a, b) => a - b);
  const frames: Frame[] = frameNumbers.map((frameNumber) => {
    const portEntries = frameEntries.get(frameNumber);
    if (!portEntries) {
      throw new ReplayParseError(`internal error: no port entries for frame ${frameNumber}`);
    }
    const ports: Partial<Record<PortIndex, FramePortData>> = {};
    for (const [port, entry] of portEntries) {
      if (!entry.pre || !entry.post) {
        const missing = entry.pre ? "PostFrameUpdate" : "PreFrameUpdate";
        throw new ReplayParseError(`frame ${frameNumber} port ${port} is missing its ${missing}`);
      }
      ports[port] = { pre: entry.pre, post: entry.post };
    }
    return { frame: frameNumber, ports };
  });

  return {
    header,
    gameStart,
    frames,
    gameEnd,
    isComplete: header.streamLength > 0 && gameEnd !== null,
  };
}
