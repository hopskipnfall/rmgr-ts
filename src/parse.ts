import { BinaryReader } from "./binary.js";
import { inflate } from "./compression.js";
import {
  EventCode,
  FORMAT_VERSION,
  GAME_FAMILY_WIDTH,
  GOOD_NAME_WIDTH,
  HEADER_SIZE,
  MAGIC,
  PLAYER_NAME_WIDTH,
  gameEndReasonFromWire,
  handicapModeFromWire,
  slotTypeFromWire,
} from "./constants.js";
import type {
  Frame,
  FramePortData,
  InputFrame,
  ItemUpdate,
  MatchEnd,
  MatchResult,
  MatchSettings,
  MatchStart,
  PortIndex,
  Replay,
  ReplayHeader,
  StateFrame,
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
    throw new ReplayParseError(
      `bad magic bytes: expected "${MAGIC}", got "${magic}"`,
    );
  }
  const version = reader.readU8();
  if (version !== FORMAT_VERSION) {
    throw new ReplayParseError(
      `unsupported format version ${version} - this package only reads version ` +
        `${FORMAT_VERSION}. There is no migration path from earlier versions; ` +
        `re-record, or convert with a dedicated migration tool if one exists.`,
    );
  }
  reader.skip(3); // reserved
  const gameFamily = reader.readFixedString(GAME_FAMILY_WIDTH);
  const goodName = reader.readFixedUtf8String(GOOD_NAME_WIDTH);
  const recorderSchemaVersion = reader.readU32();
  const recordedAtEpochMillis = reader.readU64();
  const uncompressedLength = reader.readU32();
  const compressedLength = reader.readU32();

  return {
    version,
    gameFamily,
    goodName,
    recorderSchemaVersion,
    recordedAtEpochMillis,
    uncompressedLength,
    compressedLength,
  };
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

function parseMatchStart(reader: BinaryReader): MatchStart {
  const playerNames = readPortTuple(() =>
    reader.readFixedString(PLAYER_NAME_WIDTH),
  );
  const slotType = readPortTuple(() => slotTypeFromWire(reader.readU8()));
  return { playerNames, slotType };
}

function parseMatchSettings(reader: BinaryReader): MatchSettings {
  const stageId = reader.readU8();
  const gameType = reader.readU8();
  const stockCountSetting = reader.readU8();
  const timeLimitMinutes = reader.readU8();
  const damageRatio = reader.readU8();
  const itemFrequency = reader.readU8();
  const teamsEnabled = reader.readU8() !== 0;
  const handicapMode = handicapModeFromWire(reader.readU8());
  const characterId = readPortTuple(() => reader.readU8());
  const costumeId = readPortTuple(() => reader.readU8());
  const teamColor = readPortTuple(() => reader.readU8());
  const portTeam = readPortTuple(() => reader.readU8());
  const portHandicap = readPortTuple(() => reader.readU8());
  const portCpuLevel = readPortTuple(() => reader.readU8());

  return {
    stageId,
    gameType,
    stockCountSetting,
    timeLimitMinutes,
    damageRatio,
    itemFrequency,
    teamsEnabled,
    handicapMode,
    characterId,
    costumeId,
    teamColor,
    portTeam,
    portHandicap,
    portCpuLevel,
  };
}

function parseInputFrame(reader: BinaryReader): InputFrame {
  const frame = reader.readI32();
  const port = reader.readU8() as PortIndex;
  const buttons = reader.readU16();
  const stickX = reader.readI8();
  const stickY = reader.readI8();
  return { frame, port, buttons, stickX, stickY };
}

function parseStateFrame(reader: BinaryReader): StateFrame {
  const frame = reader.readI32();
  const port = reader.readU8() as PortIndex;
  const characterId = reader.readU8();
  const actionStateId = reader.readU16();
  const positionX = reader.readF32();
  const positionY = reader.readF32();
  // The wire value is always exactly 1 or -1; read directly rather than
  // deriving from a sign check, so a corrupted value surfaces as-is
  // instead of being silently coerced to 1.
  const facingDirection = reader.readI32() as 1 | -1;
  const velocityX = reader.readF32();
  const velocityY = reader.readF32();
  const damagePercent = reader.readU32();
  const stocksRemaining = reader.readI8();
  const jumpsRemaining = reader.readU8();
  const grounded = reader.readU8() === 0;
  const hurtboxState = reader.readU8();
  const hitstunCounter = reader.readU16();
  const actionFrameCounter = reader.readU32();
  const comboHitCount = reader.readU32();
  const comboDamage = reader.readU32();

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
    jumpsRemaining,
    grounded,
    hurtboxState,
    hitstunCounter,
    actionFrameCounter,
    comboHitCount,
    comboDamage,
  };
}

function parseMatchEnd(reader: BinaryReader): MatchEnd {
  const finalFrame = reader.readI32();
  const endReason = gameEndReasonFromWire(reader.readU8());
  return { finalFrame, endReason };
}

function parseMatchResult(reader: BinaryReader): MatchResult {
  const placements = readPortTuple(() => reader.readI8());
  return { placements };
}

function parseItemUpdate(reader: BinaryReader): ItemUpdate {
  const frame = reader.readI32();
  const objectAddress = reader.readU32();
  const linkId = reader.readU8();
  const kind = reader.readI32();
  const positionX = reader.readF32();
  const positionY = reader.readF32();
  const positionZ = reader.readF32();
  return {
    frame,
    objectAddress,
    linkId,
    kind,
    positionX,
    positionY,
    positionZ,
  };
}

function parseStageHazardUpdate(reader: BinaryReader): {
  frame: number;
  hazardFlags: number;
} {
  const frame = reader.readI32();
  const hazardFlags = reader.readU8();
  return { frame, hazardFlags };
}

interface MutableFrameEntry {
  input?: InputFrame;
  state?: StateFrame;
}

/**
 * Reads a single event's payload, skipping any trailing bytes this
 * package's parser doesn't understand yet (a future schema version's
 * appended fields) - the forward-compat mechanism every event relies on.
 * `declaredSize` comes from this file's own `EventPayloads` event.
 */
function readKnownPayload<T>(
  reader: BinaryReader,
  declaredSize: number,
  parseFn: (reader: BinaryReader) => T,
): T {
  const start = reader.position;
  const value = parseFn(reader);
  const stillUnread = declaredSize - (reader.position - start);
  if (stillUnread > 0) {
    reader.skip(stillUnread);
  } else if (stillUnread < 0) {
    throw new ReplayParseError(
      `event at offset ${start} declared ${declaredSize} bytes but this parser read ${
        reader.position - start
      }`,
    );
  }
  return value;
}

function requireDeclaredSize(
  declaredSizes: ReadonlyMap<number, number>,
  code: EventCode,
  name: string,
): number {
  const size = declaredSizes.get(code);
  if (size === undefined) {
    throw new ReplayParseError(
      `EventPayloads doesn't declare a size for ${name}`,
    );
  }
  return size;
}

/**
 * Parses a complete `.rmgr` file from a byte buffer. Async because the
 * event stream is zlib-compressed (docs/RMGR_SPEC.md §3.4) and
 * decompression goes through the async Web Streams API - see
 * `compression.ts`.
 *
 * Unlike earlier format versions, a valid v5 file is always the complete
 * output of a match that reached `MatchEnd` - the writer buffers the whole
 * match in memory and only writes anything once, at match end (see
 * `docs/RMGR_SPEC.md` §2). There is no "truncated recording" case to
 * tolerate here; a file that doesn't parse cleanly is corrupt, not a crash
 * artifact.
 *
 * @throws {ReplayParseError} if the magic bytes or version are wrong, an
 *   unrecognized event code has no declared size to skip by, a `MatchStart`
 *   is missing, or an `InputFrame`/`StateFrame` pair for some frame+port is
 *   incomplete.
 */
export async function parseReplay(data: Uint8Array): Promise<Replay> {
  const headerReader = new BinaryReader(data.subarray(0, HEADER_SIZE));
  const header = parseHeader(headerReader);

  const compressed = data.subarray(
    HEADER_SIZE,
    HEADER_SIZE + header.compressedLength,
  );
  const eventBytes =
    header.compressedLength === 0
      ? new Uint8Array(0)
      : await inflate(compressed);
  if (eventBytes.byteLength !== header.uncompressedLength) {
    throw new ReplayParseError(
      `header declares uncompressedLength ${header.uncompressedLength}, but decompressing ` +
        `the event stream produced ${eventBytes.byteLength} bytes`,
    );
  }

  const familyRecognized = header.gameFamily !== "";

  const reader = new BinaryReader(eventBytes);

  const firstCode = reader.readU8();
  if (firstCode !== EventCode.EventPayloads) {
    throw new ReplayParseError(
      `expected EventPayloads (0x${EventCode.EventPayloads.toString(16)}) as the first event, ` +
        `got 0x${firstCode.toString(16)}`,
    );
  }
  const declaredSizes = parseEventPayloads(reader);

  let matchStart: MatchStart | undefined;
  let matchSettings: MatchSettings | null = null;
  let matchEnd: MatchEnd | undefined;
  let matchResult: MatchResult | null = null;
  const frameEntries = new Map<number, Map<PortIndex, MutableFrameEntry>>();
  const itemsByFrame = new Map<number, ItemUpdate[]>();
  const hazardFlagsByFrame = new Map<number, number>();

  const entryFor = (
    frameNumber: number,
    port: PortIndex,
  ): MutableFrameEntry => {
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

  while (reader.hasMore()) {
    const code = reader.readU8();
    switch (code) {
      case EventCode.MatchStart:
        matchStart = readKnownPayload(
          reader,
          requireDeclaredSize(
            declaredSizes,
            EventCode.MatchStart,
            "MatchStart",
          ),
          parseMatchStart,
        );
        break;
      case EventCode.MatchSettings:
        matchSettings = readKnownPayload(
          reader,
          requireDeclaredSize(
            declaredSizes,
            EventCode.MatchSettings,
            "MatchSettings",
          ),
          parseMatchSettings,
        );
        break;
      case EventCode.InputFrame: {
        const input = readKnownPayload(
          reader,
          requireDeclaredSize(
            declaredSizes,
            EventCode.InputFrame,
            "InputFrame",
          ),
          parseInputFrame,
        );
        entryFor(input.frame, input.port).input = input;
        break;
      }
      case EventCode.StateFrame: {
        const state = readKnownPayload(
          reader,
          requireDeclaredSize(
            declaredSizes,
            EventCode.StateFrame,
            "StateFrame",
          ),
          parseStateFrame,
        );
        entryFor(state.frame, state.port).state = state;
        break;
      }
      case EventCode.MatchEnd:
        matchEnd = readKnownPayload(
          reader,
          requireDeclaredSize(declaredSizes, EventCode.MatchEnd, "MatchEnd"),
          parseMatchEnd,
        );
        break;
      case EventCode.MatchResult:
        matchResult = readKnownPayload(
          reader,
          requireDeclaredSize(
            declaredSizes,
            EventCode.MatchResult,
            "MatchResult",
          ),
          parseMatchResult,
        );
        break;
      case EventCode.ItemUpdate: {
        const item = readKnownPayload(
          reader,
          requireDeclaredSize(
            declaredSizes,
            EventCode.ItemUpdate,
            "ItemUpdate",
          ),
          parseItemUpdate,
        );
        let items = itemsByFrame.get(item.frame);
        if (!items) {
          items = [];
          itemsByFrame.set(item.frame, items);
        }
        items.push(item);
        break;
      }
      case EventCode.StageHazardUpdate: {
        const hazard = readKnownPayload(
          reader,
          requireDeclaredSize(
            declaredSizes,
            EventCode.StageHazardUpdate,
            "StageHazardUpdate",
          ),
          parseStageHazardUpdate,
        );
        hazardFlagsByFrame.set(hazard.frame, hazard.hazardFlags);
        break;
      }
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

  if (!matchStart) {
    throw new ReplayParseError("file has no MatchStart event");
  }
  if (!matchEnd) {
    throw new ReplayParseError("file has no MatchEnd event");
  }
  if (familyRecognized && !matchSettings) {
    throw new ReplayParseError(
      "file declares a recognized gameFamily but has no MatchSettings event",
    );
  }
  if (familyRecognized && !matchResult) {
    throw new ReplayParseError(
      "file declares a recognized gameFamily but has no MatchResult event",
    );
  }

  const frameNumbers = [
    ...new Set([
      ...frameEntries.keys(),
      ...itemsByFrame.keys(),
      ...hazardFlagsByFrame.keys(),
    ]),
  ].sort((a, b) => a - b);
  const frames: Frame[] = frameNumbers.map((frameNumber) => {
    const portEntries = frameEntries.get(frameNumber);
    const ports: Partial<Record<PortIndex, FramePortData>> = {};
    if (portEntries) {
      for (const [port, entry] of portEntries) {
        if (!entry.input) {
          throw new ReplayParseError(
            `frame ${frameNumber} port ${port} has a StateFrame but no InputFrame`,
          );
        }
        ports[port] = entry.state
          ? { input: entry.input, state: entry.state }
          : { input: entry.input };
      }
    }
    const items = itemsByFrame.get(frameNumber) ?? [];
    const hazardFlags = hazardFlagsByFrame.get(frameNumber) ?? 0;
    return { frame: frameNumber, ports, items, hazardFlags };
  });

  return {
    header,
    matchStart,
    matchSettings,
    frames,
    matchEnd,
    matchResult,
  };
}
