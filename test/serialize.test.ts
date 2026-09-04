import { describe, expect, it } from "vitest";
import {
  GAME_FAMILY_WIDTH,
  GOOD_NAME_WIDTH,
  HEADER_SIZE,
  SMASH_64_FAMILY,
} from "../src/constants.js";
import { inflate } from "../src/compression.js";
import { serializeReplay } from "../src/serialize.js";
import type { SerializableReplay } from "../src/types.js";

const FIXTURE_GOOD_NAME = "SmashRemix2.0.1";
const FIXTURE_RECORDER_SCHEMA_VERSION = 1;
const FIXTURE_RECORDED_AT_EPOCH_MILLIS = 1_766_000_000_000;

/**
 * Independently builds the exact *uncompressed event stream* bytes
 * `docs/RMGR_SPEC.md` specifies for a small, fully-known fixture replay,
 * using nothing from `src/binary.ts` or `src/serialize.ts` — a plain
 * `DataView` at hand-computed offsets. This is the real cross-check:
 * `roundtrip.test.ts` only proves `serializeReplay` and `parseReplay` agree
 * with *each other*, which can't catch both of them sharing the same wrong
 * offset. This test proves `serializeReplay` matches the written spec (and
 * therefore the C++ writer, which the spec also describes) byte for byte -
 * for the compressed block itself, only that decompressing it reproduces
 * these exact bytes, since deflate's compressed *encoding* isn't part of
 * the spec (only "zlib deflate" is), while the decompressed content is.
 */
function buildExpectedEventBytes(): Uint8Array {
  const EVENT_STREAM_SIZE =
    26 /* EventPayloads: code(1) + count(1) + 8 entries * 3 bytes each (24) */ +
    (1 + 132) /* MatchStart */ +
    (1 + 32) /* MatchSettings */ +
    (1 + 9) /* InputFrame */ +
    (1 + 50) /* StateFrame */ +
    (1 + 5) /* MatchEnd */ +
    (1 + 4); /* MatchResult */
  // No ItemUpdate/StageHazardUpdate events themselves - the fixture frame
  // has no items and hazardFlags is 0 - only EventPayloads' declared entry
  // for each (this package's writer always declares every smash64-family
  // event type when the family is recognized, even for a match with none
  // of that type ever recorded).

  const buf = new ArrayBuffer(EVENT_STREAM_SIZE);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  let o = 0;

  const putAscii = (str: string, width: number) => {
    const encoded = new TextEncoder().encode(str);
    bytes.set(encoded.subarray(0, width), o);
    o += width;
  };
  const putU8 = (v: number) => {
    view.setUint8(o, v);
    o += 1;
  };
  const putI8 = (v: number) => {
    view.setInt8(o, v);
    o += 1;
  };
  const putU16 = (v: number) => {
    view.setUint16(o, v, true);
    o += 2;
  };
  const putI32 = (v: number) => {
    view.setInt32(o, v, true);
    o += 4;
  };
  const putU32 = (v: number) => {
    view.setUint32(o, v, true);
    o += 4;
  };
  const putF32 = (v: number) => {
    view.setFloat32(o, v, true);
    o += 4;
  };

  // --- EventPayloads (0x01) ---
  putU8(0x01);
  putU8(8); // 8 declared entries (3 core + 5 smash64)
  putU8(0x02);
  putU16(132); // MatchStart
  putU8(0x03);
  putU16(9); // InputFrame
  putU8(0x05);
  putU16(5); // MatchEnd
  putU8(0x04);
  putU16(50); // StateFrame
  putU8(0x06);
  putU16(25); // ItemUpdate
  putU8(0x07);
  putU16(5); // StageHazardUpdate
  putU8(0x08);
  putU16(32); // MatchSettings
  putU8(0x09);
  putU16(4); // MatchResult

  // --- MatchStart (0x02) ---
  putU8(0x02);
  putAscii("Alice", 32);
  putAscii("Bob", 32);
  putAscii("", 32);
  putAscii("", 32);
  putU8(0); // human
  putU8(0); // human
  putU8(2); // empty
  putU8(2); // empty

  // --- MatchSettings (0x08) ---
  putU8(0x08);
  putU8(0x10); // stageId
  putU8(2); // gameType
  putU8(2); // stockCountSetting
  putU8(100); // timeLimitMinutes
  putU8(100); // damageRatio
  putU8(0); // itemFrequency
  putU8(1); // teamsEnabled
  putU8(1); // handicapMode: on
  putU8(0x0b); // characterId[0]
  putU8(0x01); // characterId[1]
  putU8(0); // characterId[2]
  putU8(0); // characterId[3]
  putU8(0); // costumeId x4
  putU8(0);
  putU8(0);
  putU8(0);
  putU8(0); // teamColor x4
  putU8(0);
  putU8(0);
  putU8(0);
  putU8(1); // portTeam[0]
  putU8(2); // portTeam[1]
  putU8(0);
  putU8(0);
  putU8(10); // portHandicap[0]
  putU8(20); // portHandicap[1]
  putU8(0);
  putU8(0);
  putU8(0); // portCpuLevel x4 (both human, meaningless)
  putU8(0);
  putU8(0);
  putU8(0);

  // --- InputFrame (0x03), frame 0, port 0 ---
  putU8(0x03);
  putI32(0); // frame
  putU8(0); // port
  putU16(0x8001); // buttons: A + C-Right
  putI8(10); // stickX
  putI8(-20); // stickY

  // --- StateFrame (0x04), frame 0, port 0 ---
  putU8(0x04);
  putI32(0); // frame
  putU8(0); // port
  putU8(0x0b); // characterId
  putU16(0x000a); // actionStateId (Idle)
  putF32(1.5); // positionX
  putF32(-2.25); // positionY
  putI32(1); // facingDirection
  putF32(0.5); // velocityX
  putF32(-0.5); // velocityY
  putU32(42); // damagePercent
  putI8(2); // stocksRemaining
  putU8(1); // jumpsRemaining
  putU8(0); // groundedState (0 = grounded)
  putU8(0); // hurtboxState
  putU16(0); // hitstunCounter
  putU32(5); // actionFrameCounter
  putU32(3); // comboHitCount
  putU32(27); // comboDamage

  // --- MatchEnd (0x05) ---
  putU8(0x05);
  putI32(0); // finalFrame
  putU8(1); // endReason: normal

  // --- MatchResult (0x09) ---
  putU8(0x09);
  putI8(1); // port 0 placement
  putI8(-1); // port 1 never seated
  putI8(-1); // port 2 never seated
  putI8(-1); // port 3 never seated

  if (o !== EVENT_STREAM_SIZE) {
    throw new Error(
      `test bug: wrote ${o} bytes, expected ${EVENT_STREAM_SIZE}`,
    );
  }
  return bytes;
}

const FIXTURE: SerializableReplay = {
  gameFamily: SMASH_64_FAMILY,
  goodName: FIXTURE_GOOD_NAME,
  recorderSchemaVersion: FIXTURE_RECORDER_SCHEMA_VERSION,
  recordedAtEpochMillis: FIXTURE_RECORDED_AT_EPOCH_MILLIS,
  matchStart: {
    playerNames: ["Alice", "Bob", "", ""],
    slotType: ["human", "human", "empty", "empty"],
  },
  matchSettings: {
    stageId: 0x10,
    gameType: 2,
    stockCountSetting: 2,
    timeLimitMinutes: 100,
    damageRatio: 100,
    itemFrequency: 0,
    teamsEnabled: true,
    handicapMode: "on",
    characterId: [0x0b, 0x01, 0, 0],
    costumeId: [0, 0, 0, 0],
    teamColor: [0, 0, 0, 0],
    portTeam: [1, 2, 0, 0],
    portHandicap: [10, 20, 0, 0],
    portCpuLevel: [0, 0, 0, 0],
  },
  frames: [
    {
      frame: 0,
      ports: {
        0: {
          input: {
            frame: 0,
            port: 0,
            buttons: 0x8001,
            stickX: 10,
            stickY: -20,
          },
          state: {
            frame: 0,
            port: 0,
            characterId: 0x0b,
            actionStateId: 0x000a,
            positionX: 1.5,
            positionY: -2.25,
            facingDirection: 1,
            velocityX: 0.5,
            velocityY: -0.5,
            damagePercent: 42,
            stocksRemaining: 2,
            jumpsRemaining: 1,
            grounded: true,
            hurtboxState: 0,
            hitstunCounter: 0,
            actionFrameCounter: 5,
            comboHitCount: 3,
            comboDamage: 27,
          },
        },
      },
      items: [],
    },
  ],
  matchEnd: { finalFrame: 0, endReason: "normal" },
  matchResult: { placements: [1, -1, -1, -1] },
};

describe("serializeReplay wire format", () => {
  it("header matches docs/RMGR_SPEC.md byte-for-byte for a fully-known fixture", async () => {
    const actual = await serializeReplay(FIXTURE);
    expect(actual.byteLength).toBeGreaterThan(HEADER_SIZE);

    const header = actual.subarray(0, HEADER_SIZE);
    expect(new TextDecoder("ascii").decode(header.subarray(0, 4))).toBe("RMGR");
    expect(header[4]).toBe(5); // version
    expect(
      new TextDecoder("ascii")
        .decode(header.subarray(8, 8 + GAME_FAMILY_WIDTH))
        .replace(/\0+$/, ""),
    ).toBe(SMASH_64_FAMILY);
    expect(
      new TextDecoder("utf-8")
        .decode(header.subarray(24, 24 + GOOD_NAME_WIDTH))
        .replace(/\0+$/, ""),
    ).toBe(FIXTURE_GOOD_NAME);

    const view = new DataView(actual.buffer, actual.byteOffset, HEADER_SIZE);
    expect(view.getUint32(0x58, true)).toBe(FIXTURE_RECORDER_SCHEMA_VERSION);
    expect(Number(view.getBigUint64(0x5c, true))).toBe(
      FIXTURE_RECORDED_AT_EPOCH_MILLIS,
    );
    const uncompressedLength = view.getUint32(0x64, true);
    const compressedLength = view.getUint32(0x68, true);
    expect(compressedLength).toBe(actual.byteLength - HEADER_SIZE);

    const expectedEventBytes = buildExpectedEventBytes();
    expect(uncompressedLength).toBe(expectedEventBytes.byteLength);

    const decompressed = await inflate(
      actual.subarray(HEADER_SIZE, HEADER_SIZE + compressedLength),
    );
    expect(decompressed).toEqual(expectedEventBytes);
  });

  it("header is exactly HEADER_SIZE (108) bytes", async () => {
    const bytes = await serializeReplay(FIXTURE);
    expect(HEADER_SIZE).toBe(108);
    expect(bytes.byteLength).toBeGreaterThan(HEADER_SIZE);
  });
});
