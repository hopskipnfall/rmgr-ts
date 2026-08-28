import { BinaryReader } from "./binary.js";
import {
  EVENT_PAYLOAD_SIZES,
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
  hitboxOwnerKindFromWire,
  slotTypeFromWire,
} from "./constants.js";
import type {
  Frame,
  FramePortData,
  GameEnd,
  GameStart,
  HandicapMode,
  HitboxUpdate,
  HurtboxUpdate,
  ItemUpdate,
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
    throw new ReplayParseError(
      `bad magic bytes: expected "${MAGIC}", got "${magic}"`,
    );
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
  const recordedAtEpochMillis = reader.readU64();
  const recordedAtNanosOffset = reader.readU32();
  return {
    version,
    streamLength,
    goodName,
    recorderSchemaVersion,
    recordedAtEpochMillis,
    recordedAtNanosOffset,
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

/** The original 4-byte per-port sub-struct (docs/RMGR_SPEC.md section 4.2's `PortSettings` table) - not the full, appended-fields-merged `PortSettings` type this package exposes. */
function parseBasePortSettings(
  reader: BinaryReader,
): Omit<PortSettings, "team" | "handicap" | "cpuLevel"> {
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
  const playerNames = readPortTuple(() =>
    reader.readFixedString(PLAYER_NAME_WIDTH),
  );

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
  const ports: readonly [
    PortSettings,
    PortSettings,
    PortSettings,
    PortSettings,
  ] = [mergePort(0), mergePort(1), mergePort(2), mergePort(3)];

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

function parsePostFrame(
  reader: BinaryReader,
  declaredSize: number,
): PostFrameUpdate {
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
  const jumpsRemaining = reader.readU8();
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
    jumpsRemaining,
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

/** Schema v2's `ItemUpdate` payload size - a single (wrongly-derived) `typeId: u32` field instead of v3's `linkId: u8` + `kind: i32`. See `ItemUpdate`'s doc comment in `types.ts`. */
const ITEM_UPDATE_SCHEMA_V2_SIZE = 24;

function parseItemUpdate(
  reader: BinaryReader,
  declaredSize: number,
): ItemUpdate {
  if (declaredSize < EVENT_PAYLOAD_SIZES[EventCode.ItemUpdate]) {
    const hint =
      declaredSize === ITEM_UPDATE_SCHEMA_V2_SIZE
        ? " (this looks like a recorder schema v2 file - its ItemUpdate.typeId was never meaningful; re-record instead of parsing it)"
        : "";
    throw new ReplayParseError(
      `ItemUpdate declared size ${declaredSize} is smaller than this package's schema v3 shape (${EVENT_PAYLOAD_SIZES[EventCode.ItemUpdate]} bytes)${hint}`,
    );
  }

  const start = reader.position;
  const frame = reader.readI32();
  const objectAddress = reader.readU32();
  const linkId = reader.readU8();
  const kind = reader.readI32();
  const positionX = reader.readF32();
  const positionY = reader.readF32();
  const positionZ = reader.readF32();

  // Forward-compat: skip anything a future schema version appends to this
  // event that this parser doesn't understand yet - same mechanism as the
  // top-level event loop.
  const stillUnread = declaredSize - (reader.position - start);
  if (stillUnread > 0) {
    reader.skip(stillUnread);
  }

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

function parseStageHazardUpdate(
  reader: BinaryReader,
  declaredSize: number,
): { frame: number; hazardFlags: number } {
  const start = reader.position;
  const frame = reader.readI32();
  const hazardFlags = reader.readU8();

  const stillUnread = declaredSize - (reader.position - start);
  if (stillUnread > 0) {
    reader.skip(stillUnread);
  }

  return { frame, hazardFlags };
}

function parseHitboxUpdate(
  reader: BinaryReader,
  declaredSize: number,
): HitboxUpdate {
  const start = reader.position;
  const frame = reader.readI32();
  const ownerKind = hitboxOwnerKindFromWire(reader.readU8());
  const ownerId = reader.readU32();
  const slotIndex = reader.readU8();
  const attackState = reader.readU8();
  const damage = reader.readI32();
  const positionX = reader.readF32();
  const positionY = reader.readF32();
  const positionZ = reader.readF32();
  const size = reader.readF32();
  const angle = reader.readI32();
  const knockbackScale = reader.readI32();
  const knockbackWeight = reader.readI32();
  const knockbackBase = reader.readI32();
  const element = reader.readI32();
  const shieldDamage = reader.readI32();

  const stillUnread = declaredSize - (reader.position - start);
  if (stillUnread > 0) {
    reader.skip(stillUnread);
  }

  return {
    frame,
    ownerKind,
    ownerId,
    slotIndex,
    attackState,
    damage,
    positionX,
    positionY,
    positionZ,
    size,
    angle,
    knockbackScale,
    knockbackWeight,
    knockbackBase,
    element,
    shieldDamage,
  };
}

function parseHurtboxUpdate(
  reader: BinaryReader,
  declaredSize: number,
): HurtboxUpdate {
  const start = reader.position;
  const frame = reader.readI32();
  const port = reader.readU8() as PortIndex;
  const slotIndex = reader.readU8();
  const hitStatus = reader.readI32();
  const placement = reader.readI32();
  const isGrabbable = reader.readU8() !== 0;
  const positionX = reader.readF32();
  const positionY = reader.readF32();
  const positionZ = reader.readF32();
  const offsetX = reader.readF32();
  const offsetY = reader.readF32();
  const offsetZ = reader.readF32();
  const sizeX = reader.readF32();
  const sizeY = reader.readF32();
  const sizeZ = reader.readF32();

  const stillUnread = declaredSize - (reader.position - start);
  if (stillUnread > 0) {
    reader.skip(stillUnread);
  }

  return {
    frame,
    port,
    slotIndex,
    hitStatus,
    placement,
    isGrabbable,
    positionX,
    positionY,
    positionZ,
    offsetX,
    offsetY,
    offsetZ,
    sizeX,
    sizeY,
    sizeZ,
  };
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

  const streamEnd =
    header.streamLength > 0
      ? HEADER_SIZE + header.streamLength
      : data.byteLength;

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
  const itemsByFrame = new Map<number, ItemUpdate[]>();
  const hazardFlagsByFrame = new Map<number, number>();
  const hitboxesByFrame = new Map<number, HitboxUpdate[]>();
  const hurtboxesByFrame = new Map<number, HurtboxUpdate[]>();

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

  while (
    reader.position < Math.min(streamEnd, data.byteLength) &&
    reader.hasMore()
  ) {
    const code = reader.readU8();
    switch (code) {
      case EventCode.GameStart: {
        const declaredGameStartSize = declaredSizes.get(EventCode.GameStart);
        if (declaredGameStartSize === undefined) {
          throw new ReplayParseError(
            "EventPayloads doesn't declare a size for GameStart",
          );
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
        const declaredPostFrameSize = declaredSizes.get(
          EventCode.PostFrameUpdate,
        );
        if (declaredPostFrameSize === undefined) {
          throw new ReplayParseError(
            "EventPayloads doesn't declare a size for PostFrameUpdate",
          );
        }
        const post = parsePostFrame(reader, declaredPostFrameSize);
        entryFor(post.frame, post.port).post = post;
        break;
      }
      case EventCode.GameEnd:
        gameEnd = parseGameEnd(reader);
        break;
      case EventCode.ItemUpdate: {
        const declaredItemUpdateSize = declaredSizes.get(EventCode.ItemUpdate);
        if (declaredItemUpdateSize === undefined) {
          throw new ReplayParseError(
            "EventPayloads doesn't declare a size for ItemUpdate",
          );
        }
        const item = parseItemUpdate(reader, declaredItemUpdateSize);
        let items = itemsByFrame.get(item.frame);
        if (!items) {
          items = [];
          itemsByFrame.set(item.frame, items);
        }
        items.push(item);
        break;
      }
      case EventCode.StageHazardUpdate: {
        const declaredHazardSize = declaredSizes.get(
          EventCode.StageHazardUpdate,
        );
        if (declaredHazardSize === undefined) {
          throw new ReplayParseError(
            "EventPayloads doesn't declare a size for StageHazardUpdate",
          );
        }
        const hazard = parseStageHazardUpdate(reader, declaredHazardSize);
        hazardFlagsByFrame.set(hazard.frame, hazard.hazardFlags);
        break;
      }
      case EventCode.HitboxUpdate: {
        const declaredHitboxSize = declaredSizes.get(EventCode.HitboxUpdate);
        if (declaredHitboxSize === undefined) {
          throw new ReplayParseError(
            "EventPayloads doesn't declare a size for HitboxUpdate",
          );
        }
        const hitbox = parseHitboxUpdate(reader, declaredHitboxSize);
        let hitboxes = hitboxesByFrame.get(hitbox.frame);
        if (!hitboxes) {
          hitboxes = [];
          hitboxesByFrame.set(hitbox.frame, hitboxes);
        }
        hitboxes.push(hitbox);
        break;
      }
      case EventCode.HurtboxUpdate: {
        const declaredHurtboxSize = declaredSizes.get(EventCode.HurtboxUpdate);
        if (declaredHurtboxSize === undefined) {
          throw new ReplayParseError(
            "EventPayloads doesn't declare a size for HurtboxUpdate",
          );
        }
        const hurtbox = parseHurtboxUpdate(reader, declaredHurtboxSize);
        let hurtboxes = hurtboxesByFrame.get(hurtbox.frame);
        if (!hurtboxes) {
          hurtboxes = [];
          hurtboxesByFrame.set(hurtbox.frame, hurtboxes);
        }
        hurtboxes.push(hurtbox);
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

  if (!gameStart) {
    throw new ReplayParseError("file has no GameStart event");
  }

  // Union, not just frameEntries' keys: an ItemUpdate/StageHazardUpdate/
  // HitboxUpdate/HurtboxUpdate could in principle land on a frame with no
  // seated-port pre/post pair recorded (e.g. every port momentarily failing
  // the recorder's own validity check) - rare, but shouldn't silently
  // vanish if it happens.
  const frameNumbers = [
    ...new Set([
      ...frameEntries.keys(),
      ...itemsByFrame.keys(),
      ...hazardFlagsByFrame.keys(),
      ...hitboxesByFrame.keys(),
      ...hurtboxesByFrame.keys(),
    ]),
  ].sort((a, b) => a - b);
  const frames: Frame[] = frameNumbers.map((frameNumber) => {
    const portEntries = frameEntries.get(frameNumber);
    const ports: Partial<Record<PortIndex, FramePortData>> = {};
    if (portEntries) {
      for (const [port, entry] of portEntries) {
        if (!entry.pre || !entry.post) {
          const missing = entry.pre ? "PostFrameUpdate" : "PreFrameUpdate";
          throw new ReplayParseError(
            `frame ${frameNumber} port ${port} is missing its ${missing}`,
          );
        }
        ports[port] = { pre: entry.pre, post: entry.post };
      }
    }
    const items = itemsByFrame.get(frameNumber) ?? [];
    const hazardFlags = hazardFlagsByFrame.get(frameNumber) ?? 0;
    const hitboxes = hitboxesByFrame.get(frameNumber) ?? [];
    const hurtboxes = hurtboxesByFrame.get(frameNumber) ?? [];
    return {
      frame: frameNumber,
      ports,
      items,
      hazardFlags,
      hitboxes,
      hurtboxes,
    };
  });

  return {
    header,
    gameStart,
    frames,
    gameEnd,
    isComplete: header.streamLength > 0 && gameEnd !== null,
  };
}
