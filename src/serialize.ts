import { BinaryWriter } from "./binary.js";
import { deflate } from "./compression.js";
import {
  EVENT_PAYLOAD_SIZES,
  EventCode,
  FORMAT_VERSION,
  GAME_FAMILY_WIDTH,
  GOOD_NAME_WIDTH,
  HEADER_SIZE,
  MAGIC,
  PLAYER_NAME_WIDTH,
  gameEndReasonToWire,
  handicapModeToWire,
  slotTypeToWire,
} from "./constants.js";
import type {
  ItemUpdate,
  MatchEnd,
  MatchResult,
  MatchSettings,
  MatchStart,
  PortIndex,
  SerializableReplay,
  StateFrame,
} from "./types.js";

const PORT_ORDER: readonly PortIndex[] = [0, 1, 2, 3];

/** Core event codes/sizes - always declared. */
const CORE_EVENT_PAYLOADS_ENTRIES: ReadonlyArray<readonly [EventCode, number]> =
  [
    [EventCode.MatchStart, EVENT_PAYLOAD_SIZES[EventCode.MatchStart]],
    [EventCode.InputFrame, EVENT_PAYLOAD_SIZES[EventCode.InputFrame]],
    [EventCode.MatchEnd, EVENT_PAYLOAD_SIZES[EventCode.MatchEnd]],
  ];

/** `smash64` family event codes/sizes - declared only when `gameFamily !== ""`. */
const SMASH_64_EVENT_PAYLOADS_ENTRIES: ReadonlyArray<
  readonly [EventCode, number]
> = [
  [EventCode.StateFrame, EVENT_PAYLOAD_SIZES[EventCode.StateFrame]],
  [EventCode.ItemUpdate, EVENT_PAYLOAD_SIZES[EventCode.ItemUpdate]],
  [
    EventCode.StageHazardUpdate,
    EVENT_PAYLOAD_SIZES[EventCode.StageHazardUpdate],
  ],
  [EventCode.MatchSettings, EVENT_PAYLOAD_SIZES[EventCode.MatchSettings]],
  [EventCode.MatchResult, EVENT_PAYLOAD_SIZES[EventCode.MatchResult]],
];

function writeEventPayloads(w: BinaryWriter, familyRecognized: boolean): void {
  const entries = familyRecognized
    ? [...CORE_EVENT_PAYLOADS_ENTRIES, ...SMASH_64_EVENT_PAYLOADS_ENTRIES]
    : CORE_EVENT_PAYLOADS_ENTRIES;
  w.writeU8(EventCode.EventPayloads);
  w.writeU8(entries.length);
  for (const [code, size] of entries) {
    w.writeU8(code);
    w.writeU16(size);
  }
}

function writeMatchStart(w: BinaryWriter, matchStart: MatchStart): void {
  w.writeU8(EventCode.MatchStart);
  for (const name of matchStart.playerNames) {
    w.writeFixedString(name, PLAYER_NAME_WIDTH);
  }
  for (const slotType of matchStart.slotType) {
    w.writeU8(slotTypeToWire(slotType));
  }
}

function writeMatchSettings(w: BinaryWriter, settings: MatchSettings): void {
  w.writeU8(EventCode.MatchSettings);
  w.writeU8(settings.stageId);
  w.writeU8(settings.gameType);
  w.writeU8(settings.stockCountSetting);
  w.writeU8(settings.timeLimitMinutes);
  w.writeU8(settings.damageRatio);
  w.writeU8(settings.itemFrequency);
  w.writeU8(settings.teamsEnabled ? 1 : 0);
  w.writeU8(handicapModeToWire(settings.handicapMode));
  for (const v of settings.characterId) w.writeU8(v);
  for (const v of settings.costumeId) w.writeU8(v);
  for (const v of settings.teamColor) w.writeU8(v);
  for (const v of settings.portTeam) w.writeU8(v);
  for (const v of settings.portHandicap) w.writeU8(v);
  for (const v of settings.portCpuLevel) w.writeU8(v);
}

function writeInputFrame(
  w: BinaryWriter,
  frame: number,
  port: PortIndex,
  input: { buttons: number; stickX: number; stickY: number },
): void {
  w.writeU8(EventCode.InputFrame);
  w.writeI32(frame);
  w.writeU8(port);
  w.writeU16(input.buttons);
  w.writeI8(input.stickX);
  w.writeI8(input.stickY);
}

function writeStateFrame(w: BinaryWriter, state: StateFrame): void {
  w.writeU8(EventCode.StateFrame);
  w.writeI32(state.frame);
  w.writeU8(state.port);
  w.writeU8(state.characterId);
  w.writeU16(state.actionStateId);
  w.writeF32(state.positionX);
  w.writeF32(state.positionY);
  w.writeI32(state.facingDirection);
  w.writeF32(state.velocityX);
  w.writeF32(state.velocityY);
  w.writeU32(state.damagePercent);
  w.writeI8(state.stocksRemaining);
  w.writeU8(state.jumpsRemaining);
  w.writeU8(state.grounded ? 0 : 1);
  w.writeU8(state.hurtboxState);
  w.writeU16(state.hitstunCounter);
  w.writeU32(state.actionFrameCounter);
  w.writeU32(state.comboHitCount);
  w.writeU32(state.comboDamage);
}

function writeItemUpdate(w: BinaryWriter, item: ItemUpdate): void {
  w.writeU8(EventCode.ItemUpdate);
  w.writeI32(item.frame);
  w.writeU32(item.objectAddress);
  w.writeU8(item.linkId);
  w.writeI32(item.kind);
  w.writeF32(item.positionX);
  w.writeF32(item.positionY);
  w.writeF32(item.positionZ);
}

function writeStageHazardUpdate(
  w: BinaryWriter,
  frame: number,
  hazardFlags: number,
): void {
  w.writeU8(EventCode.StageHazardUpdate);
  w.writeI32(frame);
  w.writeU8(hazardFlags);
}

function writeMatchEnd(w: BinaryWriter, matchEnd: MatchEnd): void {
  w.writeU8(EventCode.MatchEnd);
  w.writeI32(matchEnd.finalFrame);
  w.writeU8(gameEndReasonToWire(matchEnd.endReason));
}

function writeMatchResult(w: BinaryWriter, result: MatchResult): void {
  w.writeU8(EventCode.MatchResult);
  for (const placement of result.placements) {
    w.writeI8(placement);
  }
}

/**
 * Serializes a replay to a complete `.rmgr` file buffer in one pass. Async
 * because the event stream is zlib-compressed (docs/RMGR_SPEC.md §3.4) and
 * compression goes through the async Web Streams API - see
 * `compression.ts`.
 *
 * Pass `gameFamily: "smash64"` (see `SMASH_64_FAMILY`) with `matchSettings`/
 * `matchResult` to write a full `smash64`-family file; omit all three (or
 * pass `gameFamily: ""`) to write a core-only (game-agnostic) file - in
 * that case `matchSettings`/`matchResult` must be omitted or `null`, and
 * every frame's `state`/`items`/`hazardFlags` are ignored (only `input` is
 * ever written).
 *
 * `replay.frames` does not need to be pre-sorted — this function sorts by
 * frame number before writing.
 *
 * @throws {Error} if `gameFamily` is set but `matchSettings`/`matchResult`
 *   is missing, or vice versa.
 */
export async function serializeReplay(
  replay: SerializableReplay,
): Promise<Uint8Array> {
  const gameFamily = replay.gameFamily ?? "";
  const familyRecognized = gameFamily !== "";

  if (familyRecognized && (!replay.matchSettings || !replay.matchResult)) {
    throw new Error(
      `gameFamily is "${gameFamily}" but matchSettings/matchResult was not provided`,
    );
  }
  if (!familyRecognized && (replay.matchSettings ?? replay.matchResult)) {
    throw new Error(
      "matchSettings/matchResult was provided but gameFamily is empty - " +
        "pass gameFamily (e.g. SMASH_64_FAMILY) to write a family-extension file",
    );
  }

  const eventStream = new BinaryWriter();

  writeEventPayloads(eventStream, familyRecognized);
  writeMatchStart(eventStream, replay.matchStart);
  if (familyRecognized && replay.matchSettings) {
    writeMatchSettings(eventStream, replay.matchSettings);
  }

  const sortedFrames = [...replay.frames].sort((a, b) => a.frame - b.frame);
  for (const frame of sortedFrames) {
    for (const port of PORT_ORDER) {
      const portData = frame.ports[port];
      if (!portData) {
        continue;
      }
      writeInputFrame(eventStream, frame.frame, port, portData.input);
      if (familyRecognized && portData.state) {
        writeStateFrame(eventStream, portData.state);
      }
    }
    if (familyRecognized) {
      for (const item of frame.items ?? []) {
        writeItemUpdate(eventStream, item);
      }
      if (frame.hazardFlags) {
        writeStageHazardUpdate(eventStream, frame.frame, frame.hazardFlags);
      }
    }
  }

  writeMatchEnd(eventStream, replay.matchEnd);
  if (familyRecognized && replay.matchResult) {
    writeMatchResult(eventStream, replay.matchResult);
  }

  const eventBytes = eventStream.toUint8Array();
  const compressed = await deflate(eventBytes);

  const header = new BinaryWriter();
  header.writeBytes(new TextEncoder().encode(MAGIC));
  header.writeU8(FORMAT_VERSION);
  header.writeBytes(new Uint8Array(3)); // reserved
  header.writeFixedString(gameFamily, GAME_FAMILY_WIDTH);
  header.writeFixedString(replay.goodName, GOOD_NAME_WIDTH);
  header.writeU32(familyRecognized ? (replay.recorderSchemaVersion ?? 0) : 0);
  header.writeU64(replay.recordedAtEpochMillis);
  header.writeU32(eventBytes.byteLength);
  header.writeU32(compressed.byteLength);
  const headerBytes = header.toUint8Array();
  if (headerBytes.byteLength !== HEADER_SIZE) {
    throw new Error(
      `internal error: wrote a ${headerBytes.byteLength}-byte header, expected ${HEADER_SIZE}`,
    );
  }

  const result = new Uint8Array(headerBytes.byteLength + compressed.byteLength);
  result.set(headerBytes, 0);
  result.set(compressed, headerBytes.byteLength);
  return result;
}
