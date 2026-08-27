import type { GameEndReason, HandicapMode, SlotType } from "./types.js";

/** ASCII magic bytes at offset 0x00 of every `.rmgr` file. */
export const MAGIC = "RMGR";

/**
 * The only format version this package currently reads and writes. Bumped
 * 1 -> 2 to add `goodName`/`recorderSchemaVersion`, then 2 -> 3 to add
 * `recordedAtEpochSeconds` (docs/RMGR_SPEC.md §3.1/§5) - each a deliberate
 * breaking change to the header layout itself, not something the
 * field-append/new-event mechanisms (§5) could cover. Files predating
 * version 3 aren't expected to parse under this version of the package.
 */
export const FORMAT_VERSION = 3;

/** Fixed size of the file header, in bytes. */
export const HEADER_SIZE = 88;

/** Fixed width of the header's `goodName` field, in bytes. */
export const GOOD_NAME_WIDTH = 64;

/** Fixed width of each `GameStart.playerNames` entry, in bytes. */
export const PLAYER_NAME_WIDTH = 32;

export const EventCode = {
  EventPayloads: 0x01,
  GameStart: 0x02,
  PreFrameUpdate: 0x03,
  PostFrameUpdate: 0x04,
  GameEnd: 0x05,
  /** Recorder schema v2+ only — see `docs/RMGR_SPEC.md` §4.6. */
  ItemUpdate: 0x06,
} as const;

export type EventCode = (typeof EventCode)[keyof typeof EventCode];

/**
 * The payload size (bytes, excluding the 1-byte command code) this package
 * writes for each event type — and what it expects a v1 file's own
 * `EventPayloads` event to declare. Declared here once so the reader,
 * writer, and their tests can't drift out of sync with each other.
 */
export const EVENT_PAYLOAD_SIZES: Readonly<Record<EventCode, number>> = {
  [EventCode.EventPayloads]: NaN, // self-describing; never looked up
  [EventCode.GameStart]: 164,
  [EventCode.PreFrameUpdate]: 9,
  [EventCode.PostFrameUpdate]: 50,
  [EventCode.GameEnd]: 5,
  [EventCode.ItemUpdate]: 24,
};

/**
 * `GameStart`'s original, pre-field-append size (docs/RMGR_SPEC.md section
 * 4.2) - always present in any file this format's ever produced. The
 * `teamsEnabled`/`handicapMode`/`portTeam`/`portHandicap`/`portCpuLevel`
 * fields after it (`GAME_START_APPENDED_SIZE` more bytes) may be absent in
 * an older file, whose own `EventPayloads` event will correctly declare
 * the shorter 150-byte size.
 */
export const GAME_START_BASE_SIZE = 150;

/** Byte length of the fields appended after `GAME_START_BASE_SIZE`. */
export const GAME_START_APPENDED_SIZE =
  EVENT_PAYLOAD_SIZES[EventCode.GameStart] - GAME_START_BASE_SIZE;

/**
 * `PostFrameUpdate`'s original, pre-field-append size (docs/RMGR_SPEC.md
 * section 4.4) - always present in any file this format's ever produced.
 * The `comboHitCount`/`comboDamage` fields after it
 * (`POST_FRAME_APPENDED_SIZE` more bytes) may be absent in an older file,
 * whose own `EventPayloads` event will correctly declare the shorter
 * 42-byte size.
 */
export const POST_FRAME_BASE_SIZE = 42;

/** Byte length of the fields appended after `POST_FRAME_BASE_SIZE`. */
export const POST_FRAME_APPENDED_SIZE =
  EVENT_PAYLOAD_SIZES[EventCode.PostFrameUpdate] - POST_FRAME_BASE_SIZE;

/** Controller button bits for `PreFrameUpdate.buttons`. */
export const ButtonBit = {
  A: 0x8000,
  B: 0x4000,
  Z: 0x2000,
  Start: 0x1000,
  DUp: 0x0800,
  DDown: 0x0400,
  DLeft: 0x0200,
  DRight: 0x0100,
  L: 0x0020,
  R: 0x0010,
  CUp: 0x0008,
  CDown: 0x0004,
  CLeft: 0x0002,
  CRight: 0x0001,
} as const;

export type ButtonBit = (typeof ButtonBit)[keyof typeof ButtonBit];

/** `true` if every bit in `bits` is set in `buttons`. */
export function hasButton(buttons: number, bits: number): boolean {
  return (buttons & bits) === bits;
}

const SLOT_TYPE_BY_WIRE: readonly SlotType[] = ["human", "cpu", "empty"];

export function slotTypeFromWire(wire: number): SlotType {
  const value = SLOT_TYPE_BY_WIRE[wire];
  if (value === undefined) {
    throw new RangeError(`unknown slotType wire value: ${wire}`);
  }
  return value;
}

export function slotTypeToWire(slotType: SlotType): number {
  const wire = SLOT_TYPE_BY_WIRE.indexOf(slotType);
  if (wire === -1) {
    throw new RangeError(`unknown slotType: ${String(slotType)}`);
  }
  return wire;
}

export function gameEndReasonFromWire(wire: number): GameEndReason {
  return wire === 1 ? "normal" : "aborted";
}

export function gameEndReasonToWire(reason: GameEndReason): number {
  return reason === "normal" ? 1 : 0;
}

const HANDICAP_MODE_BY_WIRE: readonly HandicapMode[] = ["off", "on", "auto"];

export function handicapModeFromWire(wire: number): HandicapMode {
  return HANDICAP_MODE_BY_WIRE[wire] ?? "off";
}

export function handicapModeToWire(mode: HandicapMode): number {
  const wire = HANDICAP_MODE_BY_WIRE.indexOf(mode);
  return wire === -1 ? 0 : wire;
}
