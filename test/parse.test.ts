import { describe, expect, it } from "vitest";
import { BinaryWriter } from "../src/binary.js";
import {
  EventCode,
  FORMAT_VERSION,
  GAME_START_BASE_SIZE,
  GOOD_NAME_WIDTH,
  HEADER_SIZE,
  MAGIC,
  POST_FRAME_BASE_SIZE,
} from "../src/constants.js";
import { ReplayParseError, parseReplay } from "../src/parse.js";
import { serializeReplay } from "../src/serialize.js";
import { makeFrame, makeGameStart, makeReplay } from "./fixtures.js";

/** Builds a raw file with an explicit header streamLength, bypassing serializeReplay's "always write the true length" behavior. */
function buildRawFile(
  streamLength: number,
  eventBytes: Uint8Array,
): Uint8Array {
  const header = new BinaryWriter();
  header.writeBytes(new TextEncoder().encode(MAGIC));
  header.writeU8(FORMAT_VERSION);
  header.writeBytes(new Uint8Array(3));
  header.writeU32(streamLength);
  header.writeFixedString("SmashRemix2.0.1", GOOD_NAME_WIDTH);
  header.writeU32(1);
  header.writeU64(1_766_000_000);
  const headerBytes = header.toUint8Array();
  const result = new Uint8Array(headerBytes.byteLength + eventBytes.byteLength);
  result.set(headerBytes, 0);
  result.set(eventBytes, headerBytes.byteLength);
  return result;
}

describe("parseReplay error handling", () => {
  it("rejects a file with the wrong magic bytes", () => {
    const bytes = serializeReplay(makeReplay());
    bytes.set(new TextEncoder().encode("XXXX"), 0);
    expect(() => parseReplay(bytes)).toThrow(ReplayParseError);
    expect(() => parseReplay(bytes)).toThrow(/magic/i);
  });

  it("rejects a file whose first event isn't EventPayloads", () => {
    const w = new BinaryWriter();
    w.writeU8(EventCode.GameStart); // wrong: should be EventPayloads (0x01) first
    const bytes = buildRawFile(w.length, w.toUint8Array());
    expect(() => parseReplay(bytes)).toThrow(ReplayParseError);
    expect(() => parseReplay(bytes)).toThrow(/EventPayloads/);
  });

  it("rejects an unrecognized event code with no declared size to skip by", () => {
    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(0); // zero declared event types
    w.writeU8(0x99); // unrecognized code, not declared anywhere
    const bytes = buildRawFile(w.length, w.toUint8Array());
    expect(() => parseReplay(bytes)).toThrow(ReplayParseError);
    expect(() => parseReplay(bytes)).toThrow(/0x99/);
  });

  it("skips a future/unrecognized event code using its declared size, and keeps parsing", () => {
    const base = serializeReplay(makeReplay({ frames: [], gameEnd: null }));

    // Splice a fake future event (code 0x42, 6-byte payload of junk) in
    // between EventPayloads and GameStart, and declare it in EventPayloads
    // as a real forward-compatible parser would encounter in a newer file.
    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(2); // 2 declared entries now: the fake one, and GameStart
    w.writeU8(0x42);
    w.writeU16(6);
    w.writeU8(EventCode.GameStart);
    w.writeU16(164);

    w.writeU8(0x42);
    w.writeBytes(new Uint8Array([1, 2, 3, 4, 5, 6]));

    // Re-use the real GameStart bytes from `base`: header(HEADER_SIZE) + EventPayloads event: code(1) + count(1) + 4 entries * 3 bytes each (12) = 14
    const gameStartEventStart = HEADER_SIZE + 14;
    w.writeBytes(
      base.subarray(gameStartEventStart, gameStartEventStart + 1 + 164),
    );

    const bytes = buildRawFile(w.length, w.toUint8Array());
    const parsed = parseReplay(bytes);

    expect(parsed.gameStart.stageId).toBe(0x10);
    expect(parsed.frames).toEqual([]);
  });

  it("treats a header streamLength of 0 as a truncated/incomplete recording and reads to EOF", () => {
    const eventStream = new BinaryWriter();
    // Build a minimal valid event stream by hand: EventPayloads + GameStart, no GameEnd.
    const full = serializeReplay(
      makeReplay({ frames: [makeFrame(0), makeFrame(1)], gameEnd: null }),
    );
    const eventBytes = full.subarray(HEADER_SIZE); // strip the real header off
    const bytes = buildRawFile(0, eventBytes); // but claim streamLength: 0, as a live-recording crash would

    const parsed = parseReplay(bytes);
    expect(parsed.header.streamLength).toBe(0);
    expect(parsed.gameEnd).toBeNull();
    expect(parsed.isComplete).toBe(false);
    expect(parsed.frames).toHaveLength(2);
    void eventStream; // unused, kept for symmetry with other tests' structure
  });

  it("throws when a frame+port has a PostFrameUpdate with no matching PreFrameUpdate", () => {
    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(4);
    w.writeU8(EventCode.GameStart);
    w.writeU16(164);
    w.writeU8(EventCode.PreFrameUpdate);
    w.writeU16(9);
    w.writeU8(EventCode.PostFrameUpdate);
    w.writeU16(42);
    w.writeU8(EventCode.GameEnd);
    w.writeU16(5);

    const base = serializeReplay(makeReplay({ frames: [], gameEnd: null }));
    // header(HEADER_SIZE) + EventPayloads event: code(1) + count(1) + 4 entries * 3 bytes each (12) = 14
    const gameStartEventStart = HEADER_SIZE + 14;
    w.writeBytes(
      base.subarray(gameStartEventStart, gameStartEventStart + 1 + 164),
    );

    // A PostFrameUpdate with no preceding PreFrameUpdate for frame 0, port 0.
    w.writeU8(EventCode.PostFrameUpdate);
    w.writeI32(0); // frame
    w.writeU8(0); // port
    w.writeU8(0); // characterId
    w.writeU16(0); // actionStateId
    w.writeF32(0); // positionX
    w.writeF32(0); // positionY
    w.writeI32(1); // facingDirection
    w.writeF32(0); // velocityX
    w.writeF32(0); // velocityY
    w.writeU32(0); // damagePercent
    w.writeI8(2); // stocksRemaining
    w.writeU8(0); // jumpsUsed
    w.writeU8(0); // groundedState
    w.writeU8(0); // hurtboxState
    w.writeU16(0); // hitstunCounter
    w.writeU32(0); // actionFrameCounter

    const bytes = buildRawFile(w.length, w.toUint8Array());
    expect(() => parseReplay(bytes)).toThrow(ReplayParseError);
    expect(() => parseReplay(bytes)).toThrow(/PreFrameUpdate/);
  });

  it("throws when the file has no GameStart event at all", () => {
    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(0);
    const bytes = buildRawFile(w.length, w.toUint8Array());
    expect(() => parseReplay(bytes)).toThrow(ReplayParseError);
    expect(() => parseReplay(bytes)).toThrow(/GameStart/);
  });

  it("defaults teamsEnabled/handicapMode/team/handicap/cpuLevel for an old, pre-field-append GameStart (declared size 150)", () => {
    // The first GAME_START_BASE_SIZE bytes of any GameStart payload this
    // package writes ARE the old v1 layout unchanged (fields were only ever
    // appended after it) - slicing them off a real serialized payload is
    // exactly what an old-format file's GameStart event looks like.
    const full = serializeReplay(
      makeReplay({ gameStart: makeGameStart(), frames: [], gameEnd: null }),
    );
    const gameStartEventStart = HEADER_SIZE + 14; // header(HEADER_SIZE) + EventPayloads event (14)
    const oldGameStartPayload = full.subarray(
      gameStartEventStart + 1,
      gameStartEventStart + 1 + GAME_START_BASE_SIZE,
    );
    expect(oldGameStartPayload).toHaveLength(GAME_START_BASE_SIZE);

    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(1); // just GameStart, old size
    w.writeU8(EventCode.GameStart);
    w.writeU16(GAME_START_BASE_SIZE);
    w.writeU8(EventCode.GameStart);
    w.writeBytes(oldGameStartPayload);

    const bytes = buildRawFile(w.length, w.toUint8Array());
    const parsed = parseReplay(bytes);

    expect(parsed.gameStart.stageId).toBe(0x10); // confirms the base fields still parsed correctly
    expect(parsed.gameStart.teamsEnabled).toBe(false);
    expect(parsed.gameStart.handicapMode).toBe("off");
    for (const port of parsed.gameStart.ports) {
      expect(port.team).toBe(0);
      expect(port.handicap).toBe(0);
      expect(port.cpuLevel).toBe(0);
    }
  });

  it("defaults comboHitCount/comboDamage for an old, pre-field-append PostFrameUpdate (declared size 42)", () => {
    // Same technique as the GameStart test above: the first
    // POST_FRAME_BASE_SIZE bytes of any PostFrameUpdate payload this
    // package writes ARE the old v1 layout unchanged, so slicing them off a
    // real serialized payload is exactly what an old-format file's
    // PostFrameUpdate event looks like.
    const full = serializeReplay(
      makeReplay({ frames: [makeFrame(0, [0])], gameEnd: null }),
    );
    const gameStartEventStart = HEADER_SIZE + 14; // header(HEADER_SIZE) + EventPayloads event (14)
    const preFrameEventStart = gameStartEventStart + (1 + 164);
    const postFrameEventStart = preFrameEventStart + (1 + 9);
    const oldPostFramePayload = full.subarray(
      postFrameEventStart + 1,
      postFrameEventStart + 1 + POST_FRAME_BASE_SIZE,
    );
    expect(oldPostFramePayload).toHaveLength(POST_FRAME_BASE_SIZE);

    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(3);
    w.writeU8(EventCode.GameStart);
    w.writeU16(164);
    w.writeU8(EventCode.PreFrameUpdate);
    w.writeU16(9);
    w.writeU8(EventCode.PostFrameUpdate);
    w.writeU16(POST_FRAME_BASE_SIZE);
    w.writeBytes(
      full.subarray(gameStartEventStart, gameStartEventStart + (1 + 164)),
    ); // real GameStart, unmodified
    w.writeBytes(
      full.subarray(preFrameEventStart, preFrameEventStart + (1 + 9)),
    ); // real PreFrameUpdate, unmodified
    w.writeU8(EventCode.PostFrameUpdate);
    w.writeBytes(oldPostFramePayload);

    const bytes = buildRawFile(w.length, w.toUint8Array());
    const parsed = parseReplay(bytes);

    const post = parsed.frames[0]?.ports[0]?.post;
    expect(post).toBeDefined();
    expect(post?.characterId).toBe(0x0b); // confirms the base fields still parsed correctly
    expect(post?.comboHitCount).toBe(0);
    expect(post?.comboDamage).toBe(0);
  });
});
