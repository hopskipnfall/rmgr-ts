# `@rmg-k/rmgr`

A TypeScript reader/writer for RMG-K's `.rmgr` replay file format — per-match
recordings of controller inputs and in-memory game state for
_Super Smash Bros. (N64) — Smash Remix_.

> This is an unofficial, fan-made project and is not affiliated with,
> endorsed by, or sponsored by Nintendo. "Super Smash Bros." and other
> referenced trademarks are the property of their respective owners.

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
const replay = parseReplay(new Uint8Array(bytes));

console.log(replay.gameStart.stageId, replay.gameStart.playerNames);
console.log(`${replay.frames.length} frames recorded`);
console.log(`recording finished cleanly: ${replay.isComplete}`);

// Every frame port 0 was seated for, in order:
for (const { frame, post } of getPortTimeline(replay, 0)) {
  console.log(frame, post.actionStateId, post.damagePercent);
}
```

For a fuller worked example — metadata, duration, per-player results, and
winner determination (including a cross-check against the last recorded
frame, since `GameEnd.placements` isn't always reliable for a port right at
the KO/results-screen transition) — see
[`examples/inspect-replay.ts`](examples/inspect-replay.ts):

```bash
npm run build
node examples/inspect-replay.ts path/to/your-match.rmgr
```

Writing a file back out:

```ts
import { writeFile } from "node:fs/promises";
import { serializeReplay } from "@rmg-k/rmgr";

const bytes = serializeReplay({
  gameStart: replay.gameStart,
  frames: replay.frames,
  gameEnd: replay.gameEnd,
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
function parseReplay(data: Uint8Array): Replay;
```

Parses a complete `.rmgr` file. Throws `ReplayParseError` for structurally
invalid data (bad magic bytes, a missing `GameStart` event, an unrecognized
event code with no declared size to skip by, or an unpaired
`PreFrameUpdate`/`PostFrameUpdate`).

Tolerates a **truncated** file — one where the recording process crashed or
was force-quit mid-match, so the header's `streamLength` was never patched
from `0`. In that case parsing reads to end-of-buffer instead of trusting
the header, `replay.gameEnd` comes back `null`, and `replay.isComplete` is
`false`. This is not an error case — it's how you tell a genuinely short
match apart from an interrupted recording.

### Serializing

```ts
function serializeReplay(replay: SerializableReplay): Uint8Array;
```

Builds a complete `.rmgr` file in memory in one pass. `replay.frames` does
not need to be pre-sorted. Omit `gameEnd` (or pass `null`) to produce a file
with no `GameEnd` event — useful for constructing test fixtures that
exercise the "truncated recording" path.

Unlike the streaming C++ writer (which has to write `streamLength: 0` and
patch it in place later, for crash safety during a _live_ recording), this
function always knows the true length up front and writes it directly.
The two writers are wire-compatible: given the same logical data, they
produce byte-identical files.

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

- `Replay` — a fully parsed file: `header`, `gameStart`, `frames`,
  `gameEnd`, `isComplete`.
- `SerializableReplay` — the subset `serializeReplay` needs; you never
  construct a `header` or compute `isComplete` yourself.
- `GameStart`, `PortSettings`, `PreFrameUpdate`, `PostFrameUpdate`,
  `GameEnd`, `Frame`, `FramePortData`.
- `PortIndex` (`0 | 1 | 2 | 3`), `SlotType` (`"human" | "cpu" | "empty"`),
  `GameEndReason` (`"aborted" | "normal"`).

### Constants

```ts
import {
  ButtonBit,
  hasButton,
  EventCode,
  FORMAT_VERSION,
  MAGIC,
} from "@rmg-k/rmgr";

hasButton(preFrame.buttons, ButtonBit.A); // true if A is held
```

`ButtonBit` has one entry per bit in `PreFrameUpdate.buttons` (see
`docs/RMGR_SPEC.md` §7.4). `hasButton` checks all bits in its second
argument are set, so it also works for combinations, e.g.
`hasButton(buttons, ButtonBit.A | ButtonBit.L)`.

## Design notes

- **No classes, no hidden state.** `parseReplay`/`serializeReplay` are pure
  functions over plain, `readonly`-everywhere data — there's no `ReplayFile`
  object wrapping a buffer with methods that secretly re-parse or mutate
  anything. This is a deliberate departure from
  [`slippi-js`](https://github.com/project-slippi/slippi-js)'s `SlippiGame`
  class API; it's not required to look like it, and plain data is easier to
  test, diff, and reason about.
- **`Uint8Array`/`DataView`, not `Buffer`.** Keeps the package portable to
  non-Node runtimes with zero conditional code.
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
  code) for a fully-known fixture. This is the test that actually catches
  "the writer and the spec disagree" — round-trip tests alone can't, since
  a bug shared by both the writer and reader would round-trip cleanly
  while still being wrong.
- **`test/roundtrip.test.ts`** and **`test/parse.test.ts`** — round-trip
  fidelity across a range of shapes (multiple ports, missing/empty player
  names, negative values, out-of-order frames, zero frames, an
  offline/CPU match, exact-width strings) and parser error handling
  (bad magic, missing `GameStart`, an unrecognized event code with and
  without a declared size to skip by, a truncated/`streamLength: 0` file,
  and an unpaired `PreFrameUpdate`/`PostFrameUpdate`).

## Acknowledgements

The `.rmgr` file format itself — a self-describing binary event stream, with
`PreFrameUpdate`/`PostFrameUpdate`/`GameEnd` events named and shaped after
Slippi's own — is explicitly modeled on
[Project Slippi](https://github.com/project-slippi)'s `.slp` replay format
for Super Smash Bros. Melee (see `docs/RMGR_SPEC.md` §1). It is not
byte-compatible with `.slp`, and departs from it in several deliberate ways,
but the overall design owes a real debt to Slippi's. This package's own API
shape is also a deliberate departure from
[`slippi-js`](https://github.com/project-slippi/slippi-js)'s `SlippiGame`
class (see Design notes above) — credit to that project regardless, for
having done this well first.
