/**
 * Minimal little-endian binary cursor reader/writer used by `parse.ts` and
 * `serialize.ts`. Deliberately dependency-free and Node/browser portable
 * (built on `Uint8Array`/`DataView`, not Node's `Buffer`).
 */

const textDecoder = new TextDecoder("ascii");
const utf8Decoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

export class BinaryReader {
  private readonly bytes: Uint8Array;
  private readonly view: DataView;
  private offset = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  /** Current read offset, in bytes from the start of the buffer. */
  get position(): number {
    return this.offset;
  }

  /** Total buffer length, in bytes. */
  get length(): number {
    return this.bytes.byteLength;
  }

  /** `true` if there is at least one more byte to read. */
  hasMore(): boolean {
    return this.offset < this.bytes.byteLength;
  }

  private require(size: number): void {
    if (this.offset + size > this.bytes.byteLength) {
      throw new RangeError(
        `unexpected end of data: need ${size} byte(s) at offset ${this.offset}, ` +
          `only ${this.bytes.byteLength - this.offset} remain`,
      );
    }
  }

  readU8(): number {
    this.require(1);
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  readI8(): number {
    this.require(1);
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  readU16(): number {
    this.require(2);
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  readI32(): number {
    this.require(4);
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readU32(): number {
    this.require(4);
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readF32(): number {
    this.require(4);
    const value = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return value;
  }

  /**
   * Reads a u64 as a plain `number` (not `bigint`) - every value this format
   * actually stores in a u64 (currently just `recordedAtEpochMillis`) is far
   * under `Number.MAX_SAFE_INTEGER` (milliseconds since the epoch is ~13
   * digits; that limit is 16), so the precision loss a `bigint` would avoid
   * never applies here in practice.
   */
  readU64(): number {
    this.require(8);
    const value = this.view.getBigUint64(this.offset, true);
    this.offset += 8;
    return Number(value);
  }

  readBytes(count: number): Uint8Array {
    this.require(count);
    const value = this.bytes.subarray(this.offset, this.offset + count);
    this.offset += count;
    return value;
  }

  /**
   * Reads a fixed-width, NUL-padded byte field as an ASCII string, trimming
   * at the first NUL (or the full width, if there is none).
   */
  readFixedString(width: number): string {
    const raw = this.readBytes(width);
    const nul = raw.indexOf(0);
    const slice = nul === -1 ? raw : raw.subarray(0, nul);
    return textDecoder.decode(slice);
  }

  /**
   * Same fixed-width/NUL-padded framing as readFixedString(), but decoded
   * as UTF-8 instead of ASCII - for fields that can genuinely hold non-ASCII
   * text (e.g. the header's `goodName`, which can be a JP ROM's Shift_JIS-
   * derived name re-encoded as UTF-8 on the C++ side - see RomSettings.cpp).
   * Truncating a multi-byte UTF-8 sequence at an arbitrary NUL search could
   * theoretically slice mid-codepoint, but that only happens if `width`
   * itself cut the name off mid-character; a truncated name is already a
   * degraded case, not a new failure mode this introduces.
   */
  readFixedUtf8String(width: number): string {
    const raw = this.readBytes(width);
    const nul = raw.indexOf(0);
    const slice = nul === -1 ? raw : raw.subarray(0, nul);
    return utf8Decoder.decode(slice);
  }

  skip(count: number): void {
    this.require(count);
    this.offset += count;
  }
}

export class BinaryWriter {
  private readonly chunks: Uint8Array[] = [];
  private size = 0;

  /** Total bytes written so far. */
  get length(): number {
    return this.size;
  }

  private push(chunk: Uint8Array): void {
    this.chunks.push(chunk);
    this.size += chunk.byteLength;
  }

  writeU8(value: number): void {
    const chunk = new Uint8Array(1);
    chunk[0] = value & 0xff;
    this.push(chunk);
  }

  writeI8(value: number): void {
    const chunk = new Uint8Array(1);
    new DataView(chunk.buffer).setInt8(0, value);
    this.push(chunk);
  }

  writeU16(value: number): void {
    const chunk = new Uint8Array(2);
    new DataView(chunk.buffer).setUint16(0, value, true);
    this.push(chunk);
  }

  writeI32(value: number): void {
    const chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setInt32(0, value, true);
    this.push(chunk);
  }

  writeU32(value: number): void {
    const chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setUint32(0, value, true);
    this.push(chunk);
  }

  writeF32(value: number): void {
    const chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setFloat32(0, value, true);
    this.push(chunk);
  }

  /** See `BinaryReader.readU64()` for why this takes/produces a plain `number`, not a `bigint`. */
  writeU64(value: number): void {
    const chunk = new Uint8Array(8);
    new DataView(chunk.buffer).setBigUint64(0, BigInt(Math.trunc(value)), true);
    this.push(chunk);
  }

  writeBytes(bytes: Uint8Array): void {
    this.push(bytes);
  }

  /** Writes `str` as fixed-width ASCII, truncated or zero-padded to `width`. */
  writeFixedString(str: string, width: number): void {
    const encoded = textEncoder.encode(str);
    const chunk = new Uint8Array(width);
    chunk.set(encoded.subarray(0, width));
    this.push(chunk);
  }

  toUint8Array(): Uint8Array {
    const result = new Uint8Array(this.size);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }
}
