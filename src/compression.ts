/**
 * zlib (RFC 1950 "deflate") compression, matching what the C++ writer
 * produces via zlib's `compress2()` (docs/RMGR_SPEC.md §3.4) - the event
 * stream is one deflate block immediately following the header.
 *
 * Built on the Web Streams `CompressionStream`/`DecompressionStream` APIs
 * (format `"deflate"` is exactly the zlib-wrapped format, not raw DEFLATE)
 * rather than a bundled zlib implementation, so this package stays
 * dependency-free and works unmodified in both Node (18+) and any modern
 * browser - the same two environments `binary.ts` already targets.
 */

async function pipeThroughStream(
  data: Uint8Array,
  stream: TransformStream<Uint8Array, Uint8Array>,
): Promise<Uint8Array> {
  const source = new Blob([data]).stream().pipeThrough(stream);
  const buffer = await new Response(source).arrayBuffer();
  return new Uint8Array(buffer);
}

/** Compresses `data` into a zlib ("deflate") stream. */
export async function deflate(data: Uint8Array): Promise<Uint8Array> {
  return pipeThroughStream(data, new CompressionStream("deflate"));
}

/** Decompresses a zlib ("deflate") stream back into raw bytes. */
export async function inflate(data: Uint8Array): Promise<Uint8Array> {
  return pipeThroughStream(data, new DecompressionStream("deflate"));
}
