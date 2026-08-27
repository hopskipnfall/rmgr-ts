import { BinaryWriter } from "./binary.js";
import {
  EVENT_PAYLOAD_SIZES,
  EventCode,
  FORMAT_VERSION,
  GOOD_NAME_WIDTH,
  MAGIC,
  PLAYER_NAME_WIDTH,
  gameEndReasonToWire,
  handicapModeToWire,
  slotTypeToWire,
} from "./constants.js";
import type {
  GameEnd,
  GameStart,
  ItemUpdate,
  PortIndex,
  PostFrameUpdate,
  PreFrameUpdate,
  SerializableReplay,
} from "./types.js";

const PORT_ORDER: readonly PortIndex[] = [0, 1, 2, 3];

/** The event types (and sizes) this package's writer ever emits, in the order declared. */
const EVENT_PAYLOADS_ENTRIES: ReadonlyArray<readonly [EventCode, number]> = [
  [EventCode.GameStart, EVENT_PAYLOAD_SIZES[EventCode.GameStart]],
  [EventCode.PreFrameUpdate, EVENT_PAYLOAD_SIZES[EventCode.PreFrameUpdate]],
  [EventCode.PostFrameUpdate, EVENT_PAYLOAD_SIZES[EventCode.PostFrameUpdate]],
  [EventCode.GameEnd, EVENT_PAYLOAD_SIZES[EventCode.GameEnd]],
  [EventCode.ItemUpdate, EVENT_PAYLOAD_SIZES[EventCode.ItemUpdate]],
];

function writeEventPayloads(w: BinaryWriter): void {
  w.writeU8(EventCode.EventPayloads);
  w.writeU8(EVENT_PAYLOADS_ENTRIES.length);
  for (const [code, size] of EVENT_PAYLOADS_ENTRIES) {
    w.writeU8(code);
    w.writeU16(size);
  }
}

function writeGameStart(w: BinaryWriter, gameStart: GameStart): void {
  w.writeU8(EventCode.GameStart);
  // Original v1 layout (docs/RMGR_SPEC.md section 4.2, offsets 0x00-0x95) -
  // do not reorder or insert fields above this line; see the appended
  // fields below for why.
  w.writeU8(gameStart.stageId);
  w.writeU8(gameStart.gameType);
  w.writeU8(gameStart.stockCountSetting);
  w.writeU8(gameStart.timeLimitMinutes);
  w.writeU8(gameStart.damageRatio);
  w.writeU8(gameStart.itemFrequency);
  for (const port of gameStart.ports) {
    w.writeU8(slotTypeToWire(port.slotType));
    w.writeU8(port.characterId);
    w.writeU8(port.costumeId);
    w.writeU8(port.teamColor);
  }
  for (const name of gameStart.playerNames) {
    w.writeFixedString(name, PLAYER_NAME_WIDTH);
  }

  // Appended fields (offsets 0x96-0xA3) - always written by this package;
  // an older reader simply won't know to look for them, per this format's
  // append-only versioning rule.
  w.writeU8(gameStart.teamsEnabled ? 1 : 0);
  w.writeU8(handicapModeToWire(gameStart.handicapMode));
  for (const port of gameStart.ports) {
    w.writeU8(port.team);
  }
  for (const port of gameStart.ports) {
    w.writeU8(port.handicap);
  }
  for (const port of gameStart.ports) {
    w.writeU8(port.cpuLevel);
  }
}

function writePreFrame(w: BinaryWriter, pre: PreFrameUpdate): void {
  w.writeU8(EventCode.PreFrameUpdate);
  w.writeI32(pre.frame);
  w.writeU8(pre.port);
  w.writeU16(pre.buttons);
  w.writeI8(pre.stickX);
  w.writeI8(pre.stickY);
}

function writePostFrame(w: BinaryWriter, post: PostFrameUpdate): void {
  w.writeU8(EventCode.PostFrameUpdate);
  w.writeI32(post.frame);
  w.writeU8(post.port);
  w.writeU8(post.characterId);
  w.writeU16(post.actionStateId);
  w.writeF32(post.positionX);
  w.writeF32(post.positionY);
  w.writeI32(post.facingDirection);
  w.writeF32(post.velocityX);
  w.writeF32(post.velocityY);
  w.writeU32(post.damagePercent);
  w.writeI8(post.stocksRemaining);
  w.writeU8(post.jumpsUsed);
  w.writeU8(post.grounded ? 0 : 1);
  w.writeU8(post.hurtboxState);
  w.writeU16(post.hitstunCounter);
  w.writeU32(post.actionFrameCounter);
  // Appended fields (docs/RMGR_SPEC.md section 4.4/5) - always written by
  // this package; an older reader simply won't know to look for them.
  w.writeU32(post.comboHitCount);
  w.writeU32(post.comboDamage);
}

function writeItemUpdate(w: BinaryWriter, item: ItemUpdate): void {
  w.writeU8(EventCode.ItemUpdate);
  w.writeI32(item.frame);
  w.writeU32(item.objectAddress);
  w.writeU32(item.typeId);
  w.writeF32(item.positionX);
  w.writeF32(item.positionY);
  w.writeF32(item.positionZ);
}

function writeGameEnd(w: BinaryWriter, gameEnd: GameEnd): void {
  w.writeU8(EventCode.GameEnd);
  w.writeU8(gameEndReasonToWire(gameEnd.endReason));
  for (const placement of gameEnd.placements) {
    w.writeI8(placement);
  }
}

/**
 * Serializes a replay to a complete `.rmgr` file buffer in one pass.
 *
 * Unlike the streaming C++ writer (which writes `streamLength: 0` and
 * patches it in place once a match ends, for crash safety during a live
 * recording), this builds the whole file in memory and always writes the
 * true length up front — there's no live/incremental use case on this
 * side, so there's nothing to patch. The two are wire-compatible: a file
 * built here is byte-for-byte what the C++ writer would have produced for
 * the same data.
 *
 * `replay.frames` does not need to be pre-sorted — this function sorts by
 * frame number before writing.
 */
export function serializeReplay(replay: SerializableReplay): Uint8Array {
  const eventStream = new BinaryWriter();

  writeEventPayloads(eventStream);
  writeGameStart(eventStream, replay.gameStart);

  const sortedFrames = [...replay.frames].sort((a, b) => a.frame - b.frame);
  for (const frame of sortedFrames) {
    for (const port of PORT_ORDER) {
      const portData = frame.ports[port];
      if (!portData) {
        continue;
      }
      writePreFrame(eventStream, portData.pre);
      writePostFrame(eventStream, portData.post);
    }
    for (const item of frame.items ?? []) {
      writeItemUpdate(eventStream, item);
    }
  }

  if (replay.gameEnd) {
    writeGameEnd(eventStream, replay.gameEnd);
  }

  const eventBytes = eventStream.toUint8Array();

  const header = new BinaryWriter();
  header.writeBytes(new TextEncoder().encode(MAGIC));
  header.writeU8(FORMAT_VERSION);
  header.writeBytes(new Uint8Array(3)); // reserved
  header.writeU32(eventBytes.byteLength);
  header.writeFixedString(replay.goodName, GOOD_NAME_WIDTH);
  header.writeU32(replay.recorderSchemaVersion);
  header.writeU64(replay.recordedAtEpochSeconds);
  const headerBytes = header.toUint8Array();

  const result = new Uint8Array(headerBytes.byteLength + eventBytes.byteLength);
  result.set(headerBytes, 0);
  result.set(eventBytes, headerBytes.byteLength);
  return result;
}
