import { describe, expect, it } from "vitest";
import { BinaryWriter } from "../src/binary.js";
import { deflate, inflate } from "../src/compression.js";
import {
  EventCode,
  FORMAT_VERSION,
  GAME_FAMILY_WIDTH,
  GOOD_NAME_WIDTH,
  HEADER_SIZE,
  MAGIC,
  SMASH_64_FAMILY,
} from "../src/constants.js";
import { ReplayParseError, parseReplay } from "../src/parse.js";
import { serializeReplay } from "../src/serialize.js";
import { makeReplay } from "./fixtures.js";

/** Builds a raw file from hand-assembled (uncompressed) event bytes, compressing and framing them exactly like `serializeReplay` would. */
async function buildRawFile(
  eventBytes: Uint8Array,
  gameFamily: string = SMASH_64_FAMILY,
): Promise<Uint8Array> {
  const compressed = await deflate(eventBytes);
  const header = new BinaryWriter();
  header.writeBytes(new TextEncoder().encode(MAGIC));
  header.writeU8(FORMAT_VERSION);
  header.writeBytes(new Uint8Array(3));
  header.writeFixedString(gameFamily, GAME_FAMILY_WIDTH);
  header.writeFixedString("SmashRemix2.0.1", GOOD_NAME_WIDTH);
  header.writeU32(1);
  header.writeU64(1_766_000_000_000);
  header.writeU32(eventBytes.byteLength);
  header.writeU32(compressed.byteLength);
  const headerBytes = header.toUint8Array();
  const result = new Uint8Array(headerBytes.byteLength + compressed.byteLength);
  result.set(headerBytes, 0);
  result.set(compressed, headerBytes.byteLength);
  return result;
}

/** Slices out the (still-compressed) event stream from a real serialized file's known event boundaries - used to reuse real MatchStart/MatchSettings bytes when hand-assembling a malformed file. `full` must be the *uncompressed* event bytes (i.e. what `parseReplay` decompressed), not the file itself. */
async function realEventBytes(): Promise<Uint8Array> {
  const full = await serializeReplay(makeReplay({ frames: [] }));
  const compressedLength = new DataView(full.buffer, full.byteOffset).getUint32(
    0x68,
    true,
  );
  return inflate(full.subarray(HEADER_SIZE, HEADER_SIZE + compressedLength));
}

describe("parseReplay error handling", () => {
  it("rejects a file with the wrong magic bytes", async () => {
    const bytes = await serializeReplay(makeReplay());
    bytes.set(new TextEncoder().encode("XXXX"), 0);
    await expect(parseReplay(bytes)).rejects.toThrow(ReplayParseError);
    await expect(parseReplay(bytes)).rejects.toThrow(/magic/i);
  });

  it("rejects a file with an unsupported version", async () => {
    const bytes = await serializeReplay(makeReplay());
    bytes[4] = 4; // version byte - the old, no-longer-supported format
    await expect(parseReplay(bytes)).rejects.toThrow(ReplayParseError);
    await expect(parseReplay(bytes)).rejects.toThrow(
      /unsupported format version 4/,
    );
  });

  it("rejects a file whose first event isn't EventPayloads", async () => {
    const w = new BinaryWriter();
    w.writeU8(EventCode.MatchStart); // wrong: should be EventPayloads (0x01) first
    w.writeBytes(new Uint8Array(132));
    const bytes = await buildRawFile(w.toUint8Array());
    await expect(parseReplay(bytes)).rejects.toThrow(ReplayParseError);
    await expect(parseReplay(bytes)).rejects.toThrow(/EventPayloads/);
  });

  it("rejects an unrecognized event code with no declared size to skip by", async () => {
    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(0); // zero declared event types
    w.writeU8(0x99); // unrecognized code, not declared anywhere
    const bytes = await buildRawFile(w.toUint8Array());
    await expect(parseReplay(bytes)).rejects.toThrow(ReplayParseError);
    await expect(parseReplay(bytes)).rejects.toThrow(/0x99/);
  });

  it("skips a future/unrecognized event code using its declared size, and keeps parsing", async () => {
    const eventBytes = await realEventBytes();
    // eventBytes = EventPayloads(26) + MatchStart(133) + MatchSettings(33) + MatchEnd(6) + MatchResult(5)
    // Splice a fake future event (code 0x42, 6-byte payload of junk) in
    // between EventPayloads and MatchStart, and declare it in EventPayloads
    // as a real forward-compatible parser would encounter in a newer file.
    const matchStartStart = 26;

    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(3); // 3 declared entries now: the fake one, MatchStart, MatchEnd
    w.writeU8(0x42);
    w.writeU16(6);
    w.writeU8(EventCode.MatchStart);
    w.writeU16(132);
    w.writeU8(EventCode.MatchEnd);
    w.writeU16(5);

    w.writeU8(0x42);
    w.writeBytes(new Uint8Array([1, 2, 3, 4, 5, 6]));

    w.writeBytes(
      eventBytes.subarray(matchStartStart, matchStartStart + 1 + 132),
    );
    w.writeU8(EventCode.MatchEnd);
    w.writeI32(0);
    w.writeU8(1);

    const bytes = await buildRawFile(w.toUint8Array(), "");
    const parsed = await parseReplay(bytes);

    expect(parsed.matchStart.playerNames[0]).toBe("Alice");
    expect(parsed.frames).toEqual([]);
  });

  it("throws when a frame+port has a StateFrame with no matching InputFrame", async () => {
    const eventBytes = await realEventBytes();
    const matchStartStart = 26;

    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(5);
    w.writeU8(EventCode.MatchStart);
    w.writeU16(132);
    w.writeU8(EventCode.StateFrame);
    w.writeU16(50);
    w.writeU8(EventCode.MatchEnd);
    w.writeU16(5);
    w.writeU8(EventCode.MatchSettings);
    w.writeU16(32);
    w.writeU8(EventCode.MatchResult);
    w.writeU16(4);

    w.writeBytes(
      eventBytes.subarray(matchStartStart, matchStartStart + 1 + 132),
    );
    w.writeU8(EventCode.MatchSettings);
    w.writeBytes(new Uint8Array(32));

    // A StateFrame with no preceding InputFrame for frame 0, port 0.
    w.writeU8(EventCode.StateFrame);
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
    w.writeU8(0); // jumpsRemaining
    w.writeU8(0); // groundedState
    w.writeU8(0); // hurtboxState
    w.writeU16(0); // hitstunCounter
    w.writeU32(0); // actionFrameCounter
    w.writeU32(0); // comboHitCount
    w.writeU32(0); // comboDamage

    w.writeU8(EventCode.MatchEnd);
    w.writeI32(0);
    w.writeU8(1);
    w.writeU8(EventCode.MatchResult);
    w.writeBytes(new Uint8Array(4));

    const bytes = await buildRawFile(w.toUint8Array());
    await expect(parseReplay(bytes)).rejects.toThrow(ReplayParseError);
    await expect(parseReplay(bytes)).rejects.toThrow(/InputFrame/);
  });

  it("throws when the file has no MatchStart event at all", async () => {
    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(0);
    const bytes = await buildRawFile(w.toUint8Array());
    await expect(parseReplay(bytes)).rejects.toThrow(ReplayParseError);
    await expect(parseReplay(bytes)).rejects.toThrow(/MatchStart/);
  });

  it("throws when the file has no MatchEnd event at all", async () => {
    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(1);
    w.writeU8(EventCode.MatchStart);
    w.writeU16(132);
    w.writeU8(EventCode.MatchStart);
    w.writeBytes(new Uint8Array(132));
    const bytes = await buildRawFile(w.toUint8Array(), "");
    await expect(parseReplay(bytes)).rejects.toThrow(ReplayParseError);
    await expect(parseReplay(bytes)).rejects.toThrow(/MatchEnd/);
  });

  it("throws when gameFamily is recognized but MatchSettings/MatchResult are missing", async () => {
    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(2);
    w.writeU8(EventCode.MatchStart);
    w.writeU16(132);
    w.writeU8(EventCode.MatchEnd);
    w.writeU16(5);
    w.writeU8(EventCode.MatchStart);
    w.writeBytes(new Uint8Array(132));
    w.writeU8(EventCode.MatchEnd);
    w.writeI32(0);
    w.writeU8(1);
    const bytes = await buildRawFile(w.toUint8Array(), SMASH_64_FAMILY);
    await expect(parseReplay(bytes)).rejects.toThrow(ReplayParseError);
    await expect(parseReplay(bytes)).rejects.toThrow(/MatchSettings/);
  });

  it("parses a core-only (gameFamily empty) file with only InputFrame per port", async () => {
    const eventBytes = await realEventBytes();
    const matchStartStart = 26;
    const matchStartBytes = eventBytes.subarray(
      matchStartStart,
      matchStartStart + 1 + 132,
    );

    const w = new BinaryWriter();
    w.writeU8(EventCode.EventPayloads);
    w.writeU8(3);
    w.writeU8(EventCode.MatchStart);
    w.writeU16(132);
    w.writeU8(EventCode.InputFrame);
    w.writeU16(9);
    w.writeU8(EventCode.MatchEnd);
    w.writeU16(5);

    w.writeBytes(matchStartBytes);
    w.writeU8(EventCode.InputFrame);
    w.writeI32(0);
    w.writeU8(0);
    w.writeU16(0x8000);
    w.writeI8(0);
    w.writeI8(0);
    w.writeU8(EventCode.MatchEnd);
    w.writeI32(0);
    w.writeU8(1);

    const bytes = await buildRawFile(w.toUint8Array(), "");
    const parsed = await parseReplay(bytes);

    expect(parsed.header.gameFamily).toBe("");
    expect(parsed.matchSettings).toBeNull();
    expect(parsed.matchResult).toBeNull();
    expect(parsed.frames[0]?.ports[0]?.input.buttons).toBe(0x8000);
    expect(parsed.frames[0]?.ports[0]?.state).toBeUndefined();
  });
});
