import { describe, expect, it } from "vitest";
import { BinaryReader, BinaryWriter } from "../src/binary.js";

describe("BinaryWriter -> BinaryReader round trip", () => {
  it("round-trips every primitive at its type's extremes", () => {
    const w = new BinaryWriter();
    w.writeU8(0);
    w.writeU8(255);
    w.writeI8(-128);
    w.writeI8(127);
    w.writeU16(0);
    w.writeU16(65535);
    w.writeI32(-2147483648);
    w.writeI32(2147483647);
    w.writeU32(0);
    w.writeU32(4294967295);
    w.writeF32(1.5);
    w.writeF32(-0.25);
    w.writeU64(0);
    w.writeU64(Number.MAX_SAFE_INTEGER); // the practical extreme for a value this API treats as a plain number, not the true u64 max

    const bytes = w.toUint8Array();
    expect(bytes.byteLength).toBe(w.length);

    const r = new BinaryReader(bytes);
    expect(r.readU8()).toBe(0);
    expect(r.readU8()).toBe(255);
    expect(r.readI8()).toBe(-128);
    expect(r.readI8()).toBe(127);
    expect(r.readU16()).toBe(0);
    expect(r.readU16()).toBe(65535);
    expect(r.readI32()).toBe(-2147483648);
    expect(r.readI32()).toBe(2147483647);
    expect(r.readU32()).toBe(0);
    expect(r.readU32()).toBe(4294967295);
    expect(r.readF32()).toBeCloseTo(1.5, 6);
    expect(r.readF32()).toBeCloseTo(-0.25, 6);
    expect(r.readU64()).toBe(0);
    expect(r.readU64()).toBe(Number.MAX_SAFE_INTEGER);
    expect(r.hasMore()).toBe(false);
  });

  it("writes little-endian byte order", () => {
    const w = new BinaryWriter();
    w.writeU16(0x1234);
    w.writeU32(0x89abcdef);
    const bytes = w.toUint8Array();
    // u16 0x1234 little-endian -> low byte 0x34 first, then 0x12
    expect([...bytes.subarray(0, 2)]).toEqual([0x34, 0x12]);
    // u32 0x89abcdef little-endian -> ef, cd, ab, 89
    expect([...bytes.subarray(2, 6)]).toEqual([0xef, 0xcd, 0xab, 0x89]);
  });

  it("round-trips fixed-width strings, NUL-padded and truncated", () => {
    const w = new BinaryWriter();
    w.writeFixedString("hi", 8);
    w.writeFixedString("way too long for four bytes", 4);
    const bytes = w.toUint8Array();
    expect(bytes.byteLength).toBe(12);

    const r = new BinaryReader(bytes);
    expect(r.readFixedString(8)).toBe("hi");
    expect(r.readFixedString(4)).toBe("way ");
  });

  it("reads an exact-width string with no trailing NUL as the full width", () => {
    const w = new BinaryWriter();
    w.writeFixedString("abcd", 4);
    const r = new BinaryReader(w.toUint8Array());
    expect(r.readFixedString(4)).toBe("abcd");
  });

  it("round-trips non-ASCII text through readFixedUtf8String (e.g. a JP ROM's goodName)", () => {
    const w = new BinaryWriter();
    w.writeFixedString("スマブラ", 32); // multi-byte UTF-8, would mangle under the ASCII decoder
    const r = new BinaryReader(w.toUint8Array());
    expect(r.readFixedUtf8String(32)).toBe("スマブラ");
  });

  it("skip() advances the cursor without producing a value", () => {
    const w = new BinaryWriter();
    w.writeU8(1);
    w.writeU8(2);
    w.writeU8(3);
    const r = new BinaryReader(w.toUint8Array());
    expect(r.readU8()).toBe(1);
    r.skip(1);
    expect(r.readU8()).toBe(3);
  });

  it("throws RangeError when reading past the end of the buffer", () => {
    const r = new BinaryReader(new Uint8Array([1, 2]));
    r.readU8();
    r.readU8();
    expect(() => r.readU8()).toThrow(RangeError);
  });

  it("throws RangeError when a multi-byte read would overrun the buffer", () => {
    const r = new BinaryReader(new Uint8Array([1, 2, 3]));
    expect(() => r.readU32()).toThrow(RangeError);
  });

  it("position and length track correctly through mixed reads", () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 6]);
    const r = new BinaryReader(bytes);
    expect(r.length).toBe(6);
    expect(r.position).toBe(0);
    r.readU16();
    expect(r.position).toBe(2);
    r.readU32();
    expect(r.position).toBe(6);
    expect(r.hasMore()).toBe(false);
  });
});
