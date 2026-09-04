# `@rmg-k/rmgr`

A TypeScript reader/writer for RMG-K's `.rmgr` replay file format — per-match
recordings of controller inputs, and (for a recognized game family) in-memory
game state for _Super Smash Bros. (N64) — Smash Remix_.

> This is an unofficial, fan-made project and is not affiliated with,
> endorsed by, or sponsored by Nintendo. "Super Smash Bros." and other
> referenced trademarks are the property of their respective owners.

> **Alpha software.** This package and the `.rmgr` format it implements are
> under active early development and subject to change without notice.
> Replay files created with the current version of RMG-K are not guaranteed
> to keep working with future versions of this package, or vice versa.

> **Format version 5 — a total break from anything this package read/wrote
> before.** There is no migration path and none is planned; `parseReplay`
> only reads version 5 files. See `docs/RMGR_SPEC.md` for the full story.

The full on-disk format is documented in
[`docs/RMGR_SPEC.md`](docs/RMGR_SPEC.md). This package is a faithful
implementation of that spec, not a reinterpretation of it — if the two ever
disagree, that's a bug.

> `docs/RMGR_SPEC.md` is currently a copy of the same file in the main
> [`RMG-K`](https://github.com/hopskipnfall/RMG-K) repository
> (`docs/RMGR_SPEC.md` there, where the C++ recorder that writes this format
> lives). The intent is for this repository to become the spec's canonical
> home and for `RMG-K`'s copy to eventually be removed in favor of this one —
> until then, keep the two in sync by hand if either changes.

> Not yet published to npm. It has no dependency on the C++ build, and lives
> in its own repository, separate from `RMG-K`.

## Install

Not yet published to npm. For now, clone this repository and:

```bash
npm install
npm run build
```

## Quick start

```ts
import { readFile } from "node:fs/promises";
import { parseReplay, getPortTimeline } from "@rmg-k/rmgr";

const bytes = await readFile("2026-08-24-Alice-Bob.rmgr");
const replay = await parseReplay(new Uint8Array(bytes)); // async - the event stream is zlib-compressed

console.log(replay.header.gameFamily, replay.matchStart.playerNames);
console.log(`${replay.frames.length} frames recorded`);

// Every frame port 0 was seated for, in order:
for (const { frame, state } of getPortTimeline(replay, 0)) {
  if (state) console.log(frame, state.actionStateId, state.damagePercent);
}
```

`state` is only present per-frame when `replay.header.gameFamily` is a
recognized family (e.g. `"smash64"`) — a core-only file (an unrecognized
game) only ever has `input`. Check `replay.matchSettings`/`replay.matchResult`
(both `null` for a core-only file) before reading anything family-specific.

For a fuller worked example — metadata, duration, per-player results, and
winner determination — see
[`examples/inspect-replay.ts`](examples/inspect-replay.ts):

```bash
npm run build
node examples/inspect-replay.ts path/to/your-match.rmgr
```

Writing a file back out:

```ts
import { writeFile } from "node:fs/promises";
import { serializeReplay, SMASH_64_FAMILY } from "@rmg-k/rmgr";

const bytes = await serializeReplay({
  gameFamily: SMASH_64_FAMILY,
  goodName: replay.header.goodName,
  recordedAtEpochMillis: replay.header.recordedAtEpochMillis,
  matchStart: replay.matchStart,
  matchSettings: replay.matchSettings,
  frames: replay.frames,
  matchEnd: replay.matchEnd,
  matchResult: replay.matchResult,
});
await writeFile("copy.rmgr", bytes);
```

`parseReplay`/`serializeReplay` work on `Uint8Array`, not Node's `Buffer` —
this keeps the package usable in a browser or any other JS runtime with no
changes. A Node `Buffer` is already a `Uint8Array`, so `readFile()`'s result
can be passed to `parseReplay` directly (or wrapped, as above, if you want
to be explicit).

## API

### Parsing

```ts
function parseReplay(data: Uint8Array): Promise<Replay>;
```

Parses a complete `.rmgr` file. **Async** — the event stream is
zlib-compressed (see `docs/RMGR_SPEC.md` §3.4), and decompression goes
through the async Web Streams `DecompressionStream` API (available in Node
18+ and every modern browser, no external dependency). Throws
`ReplayParseError` for structurally invalid data (bad magic bytes, an
unsupported version, a missing `MatchStart`/`MatchEnd`, a recognized
`gameFamily` missing its `MatchSettings`/`MatchResult`, an unrecognized event
code with no declared size to skip by, or an unpaired
`InputFrame`/`StateFrame`).

Unlike earlier format versions, a valid v5 file is always the complete
output of a match that reached `MatchEnd` — the writer buffers the whole
match in memory and only writes anything once, at match end. There's no
"truncated recording" case to tolerate; a file that doesn't parse cleanly is
corrupt, not a crash artifact.

### Serializing

```ts
function serializeReplay(replay: SerializableReplay): Promise<Uint8Array>;
```

Builds a complete `.rmgr` file in memory in one pass. **Async** for the
mirror-image reason `parseReplay` is — compression via `CompressionStream`.
`replay.frames` does not need to be pre-sorted.

Pass `gameFamily: SMASH_64_FAMILY` with `matchSettings`/`matchResult` to
write a full `smash64`-family file; omit all three (or pass `gameFamily:
""`) to write a core-only (game-agnostic) file, in which case every frame's
`state`/`items`/`hazardFlags` are ignored — only `input` is ever written.
Mismatching these (a `gameFamily` with no `matchSettings`, or vice versa)
throws.

### Querying a parsed replay

```ts
function getFrame(replay: Replay, frameNumber: number): Frame | undefined;
function getPortTimeline(replay: Replay, port: PortIndex): readonly PortFrame[];
function getSeatedPorts(replay: Replay): readonly PortIndex[];
```

`replay.frames` is a plain sorted array and is always safe to iterate
directly — these are just the two or three lookups that come up often
enough to be worth naming. `getFrame` is O(n); prefer iterating
`replay.frames` yourself in a hot loop over the whole file.

### Types

All the shapes below live in `src/types.ts` and are exported from the
package root. They mirror `docs/RMGR_SPEC.md` field-for-field, including
its doc comments — read the spec for what each field actually means; the
type names and JSDoc here are meant to save you a context switch, not
replace it.

- `Replay` — a fully parsed file: `header`, `matchStart`, `matchSettings`
  (`null` if core-only), `frames`, `matchEnd`, `matchResult` (`null` if
  core-only).
- `SerializableReplay` — the subset `serializeReplay` needs; you never
  construct a `header` yourself.
- Core (always present): `MatchStart`, `InputFrame`, `MatchEnd`.
- `smash64`-family extension (present only when recognized): `MatchSettings`,
  `StateFrame`, `ItemUpdate`.
- `Frame`, `FramePortData` (`input` always, `state` only for a recognized
  family).
- `PortIndex` (`0 | 1 | 2 | 3`), `SlotType` (`"human" | "cpu" | "empty"`),
  `GameEndReason` (`"aborted" | "normal"`), `HandicapMode`
  (`"off" | "on" | "auto"`).

### Constants

```ts
import {
  ButtonBit,
  hasButton,
  EventCode,
  FORMAT_VERSION,
  MAGIC,
  SMASH_64_FAMILY,
} from "@rmg-k/rmgr";

hasButton(inputFrame.buttons, ButtonBit.A); // true if A is held
```

`ButtonBit` has one entry per bit in `InputFrame.buttons` (see
`docs/RMGR_SPEC.md` §8.4). `hasButton` checks all bits in its second
argument are set, so it also works for combinations, e.g.
`hasButton(buttons, ButtonBit.A | ButtonBit.L)`.

### Lookups & definitions

```ts
import {
  CharacterId,
  StageId,
  ActionStateId,
  getCharacterName,
  getStageName,
  getActionStateName,
  isShieldState,
  isShieldBreakState,
  isGrabState,
  isLedgeState,
  isFoxCharacter,
} from "@rmg-k/rmgr";

getCharacterName(CharacterId.Fox); // "Fox"
getCharacterName(CharacterId.Fox, "ja"); // "フォックス"
getStageName(StageId.DreamLand); // "Dream Land"
getActionStateName(ActionStateId.CliffCatch); // "CliffCatch"
isLedgeState(state.actionStateId); // true if in a ledge animation
```

## Design notes

- **No classes, no hidden state.** `parseReplay`/`serializeReplay` are pure
  (async) functions over plain, `readonly`-everywhere data — there's no
  `ReplayFile` object wrapping a buffer with methods that secretly re-parse
  or mutate anything. This is a deliberate departure from
  [`slippi-js`](https://github.com/project-slippi/slippi-js)'s `SlippiGame`
  class API; it's not required to look like it, and plain data is easier to
  test, diff, and reason about.
- **`Uint8Array`/`DataView`, not `Buffer`; Web Streams, not a bundled zlib.**
  Both choices keep the package portable to non-Node runtimes with zero
  conditional code - `CompressionStream`/`DecompressionStream` are available
  in Node 18+ and every modern browser.
- **Strict TypeScript.** `strict`, `noUncheckedIndexedAccess`, and
  `exactOptionalPropertyTypes` are all on — see `tsconfig.json`.

## Testing

```bash
npm test          # run once
npm run test:watch
npm run typecheck  # tsc --noEmit
```

Three kinds of coverage, deliberately not overlapping:

- **`test/binary.test.ts`** — the low-level `BinaryReader`/`BinaryWriter`
  primitives in isolation (every integer type's extremes, float precision,
  fixed-width strings, bounds checking, endianness).
- **`test/serialize.test.ts`** — cross-checks `serializeReplay`'s output
  against an independently hand-built buffer (plain `DataView` calls at
  offsets copied from `docs/RMGR_SPEC.md`, not from this package's own
  code) for a fully-known fixture: the header exactly, and the compressed
  event stream after decompressing it (deflate's compressed _encoding_
  isn't part of the spec, only "zlib deflate" is - the decompressed content
  is what's checked byte-for-byte). This is the test that actually catches
  "the writer and the spec disagree" — round-trip tests alone can't, since
  a bug shared by both the writer and reader would round-trip cleanly
  while still being wrong.
- **`test/roundtrip.test.ts`** and **`test/parse.test.ts`** — round-trip
  fidelity across a range of shapes (multiple ports, missing/empty player
  names, negative values, out-of-order frames, zero frames, an
  offline/CPU match, a core-only/unrecognized-family file, exact-width
  strings) and parser error handling (bad magic, unsupported version,
  missing `MatchStart`/`MatchEnd`, a recognized family missing its
  `MatchSettings`/`MatchResult`, an unrecognized event code with and
  without a declared size to skip by, and an unpaired
  `InputFrame`/`StateFrame`).

## Acknowledgements

The `.rmgr` file format itself — a self-describing binary event stream, with
events named and shaped after Slippi's own — is explicitly modeled on
[Project Slippi](https://github.com/project-slippi)'s `.slp` replay format
for Super Smash Bros. Melee (see `docs/RMGR_SPEC.md` §1). It is not
byte-compatible with `.slp`, and departs from it in several deliberate ways,
but the overall design owes a real debt to Slippi's. This package's own API
shape is also a deliberate departure from
[`slippi-js`](https://github.com/project-slippi/slippi-js)'s `SlippiGame`
class (see Design notes above) — credit to that project regardless, for
having done this well first.
