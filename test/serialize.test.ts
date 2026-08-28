import { describe, expect, it } from "vitest";
import { GOOD_NAME_WIDTH, HEADER_SIZE } from "../src/constants.js";
import { serializeReplay } from "../src/serialize.js";
import type { SerializableReplay } from "../src/types.js";

const FIXTURE_GOOD_NAME = "SmashRemix2.0.1";
const FIXTURE_RECORDER_SCHEMA_VERSION = 1;
const FIXTURE_RECORDED_AT_EPOCH_SECONDS = 1_766_000_000;

/**
 * Independently builds the exact bytes `docs/RMGR_SPEC.md` specifies for a
 * small, fully-known fixture replay, using nothing from `src/binary.ts` or
 * `src/serialize.ts` — a plain `DataView` at hand-computed offsets. This is
 * the real cross-check: `roundtrip.test.ts` only proves `serializeReplay`
 * and `parseReplay` agree with *each other*, which can't catch both of them
 * sharing the same wrong offset. This test proves `serializeReplay` matches
 * the written spec (and therefore the C++ writer, which the spec also
 * describes) byte for byte.
 */
function buildExpectedBytes(): Uint8Array {
  const EVENT_STREAM_SIZE =
    26 /* EventPayloads: code(1) + count(1) + 8 entries * 3 bytes each (24) */ +
    (1 + 164) /* GameStart */ +
    (1 + 9) /* PreFrame */ +
    (1 + 50) /* PostFrame */ +
    (1 + 5); /* GameEnd */
  // No ItemUpdate/StageHazardUpdate/HitboxUpdate/HurtboxUpdate events
  // themselves - the fixture frame has no items, hazardFlags is 0, and no
  // hitboxes/hurtboxes - only EventPayloads' declared entry for each (this
  // package's writer always declares every event type it ever emits, even
  // for a match with none of that type ever recorded).
  const TOTAL_SIZE = HEADER_SIZE /* header */ + EVENT_STREAM_SIZE;

  const buf = new ArrayBuffer(TOTAL_SIZE);
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
  const putU64 = (v: number) => {
    view.setBigUint64(o, BigInt(v), true);
    o += 8;
  };

  // --- File header ---
  putAscii("RMGR", 4);
  putU8(3); // version
  o += 3; // reserved, already zero
  putU32(EVENT_STREAM_SIZE); // streamLength
  putAscii(FIXTURE_GOOD_NAME, GOOD_NAME_WIDTH);
  putU32(FIXTURE_RECORDER_SCHEMA_VERSION);
  putU64(FIXTURE_RECORDED_AT_EPOCH_SECONDS);

  // --- EventPayloads (0x01) ---
  putU8(0x01);
  putU8(8); // 8 declared entries
  putU8(0x02);
  putU16(164); // GameStart
  putU8(0x03);
  putU16(9); // PreFrameUpdate
  putU8(0x04);
  putU16(50); // PostFrameUpdate
  putU8(0x05);
  putU16(5); // GameEnd
  putU8(0x06);
  putU16(25); // ItemUpdate
  putU8(0x07);
  putU16(5); // StageHazardUpdate
  putU8(0x08);
  putU16(55); // HitboxUpdate
  putU8(0x09);
  putU16(51); // HurtboxUpdate

  // --- GameStart (0x02) ---
  putU8(0x02);
  putU8(0x10); // stageId
  putU8(2); // gameType
  putU8(2); // stockCountSetting
  putU8(100); // timeLimitMinutes
  putU8(100); // damageRatio
  putU8(0); // itemFrequency
  // ports[0..3]: slotType, characterId, costumeId, teamColor
  putU8(0); // human
  putU8(0x0b);
  putU8(0);
  putU8(0);
  putU8(0); // human
  putU8(0x01);
  putU8(0);
  putU8(0);
  putU8(2); // empty
  putU8(0);
  putU8(0);
  putU8(0);
  putU8(2); // empty
  putU8(0);
  putU8(0);
  putU8(0);
  // playerNames[0..3], 32 bytes each, NUL-padded
  putAscii("Alice", 32);
  putAscii("Bob", 32);
  putAscii("", 32);
  putAscii("", 32);
  // --- GameStart appended fields (docs/RMGR_SPEC.md section 4.2, offsets 0x96-0xA3) ---
  putU8(1); // teamsEnabled
  putU8(1); // handicapMode: on
  putU8(1);
  putU8(2);
  putU8(0);
  putU8(0); // portTeam
  putU8(10);
  putU8(20);
  putU8(0);
  putU8(0); // portHandicap
  putU8(0);
  putU8(0);
  putU8(0);
  putU8(0); // portCpuLevel (both human, meaningless)

  // --- PreFrameUpdate (0x03), frame 0, port 0 ---
  putU8(0x03);
  putI32(0); // frame
  putU8(0); // port
  putU16(0x8001); // buttons: A + C-Right
  putI8(10); // stickX
  putI8(-20); // stickY

  // --- PostFrameUpdate (0x04), frame 0, port 0 ---
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

  // --- GameEnd (0x05) ---
  putU8(0x05);
  putU8(1); // endReason: normal
  putI8(1); // port 0 placement
  putI8(-1); // port 1 never seated
  putI8(-1); // port 2 never seated
  putI8(-1); // port 3 never seated

  if (o !== TOTAL_SIZE) {
    throw new Error(`test bug: wrote ${o} bytes, expected ${TOTAL_SIZE}`);
  }
  return bytes;
}

const FIXTURE: SerializableReplay = {
  goodName: FIXTURE_GOOD_NAME,
  recorderSchemaVersion: FIXTURE_RECORDER_SCHEMA_VERSION,
  recordedAtEpochSeconds: FIXTURE_RECORDED_AT_EPOCH_SECONDS,
  gameStart: {
    stageId: 0x10,
    gameType: 2,
    stockCountSetting: 2,
    timeLimitMinutes: 100,
    damageRatio: 100,
    itemFrequency: 0,
    teamsEnabled: true,
    handicapMode: "on",
    ports: [
      {
        slotType: "human",
        characterId: 0x0b,
        costumeId: 0,
        teamColor: 0,
        team: 1,
        handicap: 10,
        cpuLevel: 0,
      },
      {
        slotType: "human",
        characterId: 0x01,
        costumeId: 0,
        teamColor: 0,
        team: 2,
        handicap: 20,
        cpuLevel: 0,
      },
      {
        slotType: "empty",
        characterId: 0,
        costumeId: 0,
        teamColor: 0,
        team: 0,
        handicap: 0,
        cpuLevel: 0,
      },
      {
        slotType: "empty",
        characterId: 0,
        costumeId: 0,
        teamColor: 0,
        team: 0,
        handicap: 0,
        cpuLevel: 0,
      },
    ],
    playerNames: ["Alice", "Bob", "", ""],
  },
  frames: [
    {
      frame: 0,
      ports: {
        0: {
          pre: { frame: 0, port: 0, buttons: 0x8001, stickX: 10, stickY: -20 },
          post: {
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
  gameEnd: { endReason: "normal", placements: [1, -1, -1, -1] },
};

describe("serializeReplay wire format", () => {
  it("matches docs/RMGR_SPEC.md byte-for-byte for a fully-known fixture", () => {
    const actual = serializeReplay(FIXTURE);
    const expected = buildExpectedBytes();
    expect(actual).toEqual(expected);
  });

  it("produces exactly 346 bytes for the fixture (88 header + 26 + 165 + 10 + 51 + 6)", () => {
    expect(serializeReplay(FIXTURE).byteLength).toBe(346);
  });

  it("writes the magic bytes at offset 0 and the version at offset 4", () => {
    const bytes = serializeReplay(FIXTURE);
    expect(new TextDecoder("ascii").decode(bytes.subarray(0, 4))).toBe("RMGR");
    expect(bytes[4]).toBe(3);
  });

  it("writes streamLength as the byte count after the header", () => {
    const bytes = serializeReplay(FIXTURE);
    const streamLength = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    ).getUint32(8, true);
    expect(streamLength).toBe(bytes.byteLength - HEADER_SIZE);
  });
});
