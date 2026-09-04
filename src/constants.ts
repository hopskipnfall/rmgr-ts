import type { GameEndReason, HandicapMode, SlotType } from "./types.js";

/** ASCII magic bytes at offset 0x00 of every `.rmgr` file. */
export const MAGIC = "RMGR";

/**
 * The only format version `serializeReplay` writes, and the only one
 * `parseReplay` reads. `docs/RMGR_SPEC.md` (in the RMG-K repository) is the
 * authoritative byte-layout reference. This is a ground-up rewrite from
 * whatever this package read/wrote before - no read-compat shim for older
 * files exists or is planned, matching the C++ writer's own "no migration
 * path" stance.
 */
export const FORMAT_VERSION = 5;

/** Fixed size of the file header, in bytes. */
export const HEADER_SIZE = 108;

/** Fixed width of the header's `goodName` field, in bytes. */
export const GOOD_NAME_WIDTH = 64;

/** Fixed width of the header's `gameFamily` field, in bytes. */
export const GAME_FAMILY_WIDTH = 16;

/** Fixed width of each `MatchStart.playerNames` entry, in bytes. */
export const PLAYER_NAME_WIDTH = 32;

/** `ReplayHeader.gameFamily` value for Smash Remix / vanilla SSB64 recordings. */
export const SMASH_64_FAMILY = "smash64";

export const EventCode = {
  EventPayloads: 0x01,
  /** Core - always present. */
  MatchStart: 0x02,
  /** Core - always present. */
  InputFrame: 0x03,
  /** `smash64` family extension only. */
  StateFrame: 0x04,
  /** Core - always present. */
  MatchEnd: 0x05,
  /** `smash64` family extension only. */
  ItemUpdate: 0x06,
  /** `smash64` family extension only. */
  StageHazardUpdate: 0x07,
  /** `smash64` family extension only. */
  MatchSettings: 0x08,
  /** `smash64` family extension only. */
  MatchResult: 0x09,
} as const;

export type EventCode = (typeof EventCode)[keyof typeof EventCode];

/**
 * The payload size (bytes, excluding the 1-byte command code) this package
 * writes for each event type, and what it expects a file's own
 * `EventPayloads` event to declare. Declared here once so the reader,
 * writer, and their tests can't drift out of sync with each other.
 */
export const EVENT_PAYLOAD_SIZES: Readonly<Record<EventCode, number>> = {
  [EventCode.EventPayloads]: NaN, // self-describing; never looked up
  [EventCode.MatchStart]: 132,
  [EventCode.InputFrame]: 9,
  [EventCode.StateFrame]: 50,
  [EventCode.MatchEnd]: 5,
  [EventCode.ItemUpdate]: 25,
  [EventCode.StageHazardUpdate]: 5,
  [EventCode.MatchSettings]: 32,
  [EventCode.MatchResult]: 4,
};

/** Controller button bits for `InputFrame.buttons`. */
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

/** `StageHazardUpdate.hazardFlags` bits. */
export const HazardFlag = {
  WhispyBlowing: 0x01,
  /**
   * Wind direction: unset = blowing left, set = blowing right. Only
   * meaningful (and only ever set by the recorder) when `WhispyBlowing`
   * is also set.
   */
  WhispyBlowingRight: 0x02,
} as const;

export type HazardFlag = (typeof HazardFlag)[keyof typeof HazardFlag];

/** `true` if every bit in `bits` is set in `hazardFlags`. */
export function hasHazardFlag(hazardFlags: number, bits: number): boolean {
  return (hazardFlags & bits) === bits;
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
