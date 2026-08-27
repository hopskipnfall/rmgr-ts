/**
 * Types for the RMG-K `.rmgr` replay file format.
 *
 * These mirror the on-disk layout described in `docs/RMGR_SPEC.md` at the
 * repository root field-for-field. If you're changing a shape here, check
 * whether the spec (and the C++ writer in `Source/RMG-Core/Replay.cpp`)
 * needs to change too.
 */

/** N64 controller port, 0-indexed. */
export type PortIndex = 0 | 1 | 2 | 3;

/** Wire values: 0 human, 1 CPU, 2 empty. */
export type SlotType = "human" | "cpu" | "empty";

/** Wire values: 0 aborted, 1 normal end. */
export type GameEndReason = "aborted" | "normal";

/** Wire values: 0 off, 1 on, 2 auto. */
export type HandicapMode = "off" | "on" | "auto";

export interface PortSettings {
  readonly slotType: SlotType;
  /** Meaningless when `slotType === "empty"`. See `docs/RMGR_SPEC.md` §7.1. */
  readonly characterId: number;
  readonly costumeId: number;
  readonly teamColor: number;
  /**
   * Team number this port is assigned to. Only meaningful when
   * `GameStart.teamsEnabled` is true. On the wire this lives in a separate
   * appended array from the rest of `PortSettings` (docs/RMGR_SPEC.md
   * section 4.2's field-append note) - merged into one object here because
   * that's a more useful shape for callers than mirroring the byte layout.
   * `0` if the match was recorded by a version of this package/format
   * before this field existed, or if this port hadn't spawned yet when
   * `GameStart` was captured - see the spec section this links to.
   */
  readonly team: number;
  /** This port's handicap value. Only meaningful when `GameStart.handicapMode !== "off"`. Same appended-field caveats as `team`. */
  readonly handicap: number;
  /** CPU difficulty. Meaningless for a `"human"` `slotType`. Same appended-field caveats as `team`. */
  readonly cpuLevel: number;
}

/**
 * Static, whole-match information. Written once, immediately after the
 * file's `EventPayloads` event.
 */
export interface GameStart {
  readonly stageId: number;
  /** 1 = time, 2 = stock, 3 = both. */
  readonly gameType: number;
  /** 0-based (e.g. `2` means "3 stocks"). */
  readonly stockCountSetting: number;
  /** 100 = infinite. */
  readonly timeLimitMinutes: number;
  /** 50 = 50%, 200 = 200%. */
  readonly damageRatio: number;
  /** 0 (none) .. 5 (high). */
  readonly itemFrequency: number;
  /** `false` for a file recorded before this field existed - see `PortSettings.team`'s doc comment. */
  readonly teamsEnabled: boolean;
  /** `"off"` for a file recorded before this field existed - see `PortSettings.team`'s doc comment. */
  readonly handicapMode: HandicapMode;
  /** Index = port number, 0-3. */
  readonly ports: readonly [
    PortSettings,
    PortSettings,
    PortSettings,
    PortSettings,
  ];
  /**
   * Sourced from netplay room metadata, never from in-game name tags.
   * An empty string for an offline match or an unnamed port.
   */
  readonly playerNames: readonly [string, string, string, string];
}

/**
 * Input-side data for one port, one frame — captured before that frame's
 * inputs are processed. Uses the game's already-processed button/stick
 * values, which are available uniformly for both human and CPU ports.
 */
export interface PreFrameUpdate {
  /** 0 at the first frame this match's recording enters the "ongoing" state. */
  readonly frame: number;
  readonly port: PortIndex;
  /** Processed button bitmask — see `ButtonBit` in `constants.ts`. */
  readonly buttons: number;
  readonly stickX: number;
  readonly stickY: number;
}

/**
 * State-side data for one port, one frame — captured after that frame's
 * physics/collision resolution.
 */
export interface PostFrameUpdate {
  readonly frame: number;
  readonly port: PortIndex;
  readonly characterId: number;
  readonly actionStateId: number;
  readonly positionX: number;
  readonly positionY: number;
  /** 1 = facing right, -1 = facing left. */
  readonly facingDirection: 1 | -1;
  readonly velocityX: number;
  readonly velocityY: number;
  /** Whole-number percent, as the game itself stores it (not fractional). */
  readonly damagePercent: number;
  /** 0-based; negative once eliminated. */
  readonly stocksRemaining: number;
  readonly jumpsUsed: number;
  readonly grounded: boolean;
  /** `0x03` = intangible/invincible. See `docs/RMGR_SPEC.md` §4.4. */
  readonly hurtboxState: number;
  /** Non-zero while in hitstun. */
  readonly hitstunCounter: number;
  /** Frame counter of the current action state, resets when it changes. */
  readonly actionFrameCounter: number;
  /**
   * Native engine combo counter (not mod-added, tracked with the in-game
   * combo meter display off too). Belongs to the *victim* (this port), not
   * the attacker: hits taken in the current unbroken chain. `0` = no active
   * chain, `1` = a single hit (not yet a "combo" by convention), `2+` = an
   * actual combo. Zeroes the instant the chain breaks - Smash Remix extends
   * what counts as "unbroken" to survive grabs/wall-bounces/tech-chases,
   * which vanilla would reset. `0` in a file recorded before this field
   * existed. See docs/RMGR_SPEC.md §4.4.
   */
  readonly comboHitCount: number;
  /** Running damage dealt within the same chain as `comboHitCount`; zeroes at the same instant. `0` in an older file. */
  readonly comboDamage: number;
}

/** One seated port's paired Pre/Post-frame data for a single frame. */
export interface FramePortData {
  readonly pre: PreFrameUpdate;
  readonly post: PostFrameUpdate;
}

/**
 * One live object on the shared item/hazard/projectile list, for a single
 * frame — see `docs/RMGR_SPEC.md` §4.6. Covers everything on that list, not
 * just character-special-move projectiles: spawned items and stage hazard
 * objects (thrown bananas, Poké Balls, Waddle Dees, ...) share the same
 * list and currently can't be told apart from a projectile by `typeId`
 * alone. Absent (empty `Frame.items`) in a file recorded before schema v2 —
 * see `ReplayHeader.recorderSchemaVersion`.
 */
export interface ItemUpdate {
  readonly frame: number;
  /**
   * The object's own RDRAM address at recording time — not a semantic
   * spawn ID the engine assigns, just the closest available stable
   * per-object identity. Valid for as long as that object was alive; the
   * address can be reused once an object is freed, so don't assume two
   * `ItemUpdate`s with the same `objectAddress` across widely-separated
   * frames are the same object.
   */
  readonly objectAddress: number;
  /**
   * Raw value read from the object. `0x00`-`0x1F` is the vanilla
   * item/projectile ID range, `0x20`+ is Remix-added — see
   * `docs/RMGR_SPEC.md` §7.6. **There is currently no name lookup table for
   * these IDs** — this is a bare number, not `"boomerang"` or `"bomb"`.
   */
  readonly typeId: number;
  readonly positionX: number;
  readonly positionY: number;
  /**
   * Read using the same object→topjoint indirection as X/Y, but *not*
   * independently confirmed to be correct for this specific field — see
   * `docs/RMGR_SPEC.md` §4.6. Treat with more skepticism than X/Y.
   */
  readonly positionZ: number;
}

/**
 * One recorded frame. `ports` only has entries for ports that were seated
 * and live that frame — never assume all four are present. `items` is
 * every `ItemUpdate` recorded for this frame, in the order they appeared in
 * the file. `parseReplay` always returns an array here (empty if nothing
 * was live on the item/hazard/projectile list that frame, or if this file
 * predates recorder schema v2) — declared optional only so code that
 * hand-constructs a `Frame` (tests, older callers) isn't forced to specify
 * it; treat a missing `items` the same as an empty array.
 */
export interface Frame {
  readonly frame: number;
  readonly ports: Readonly<Partial<Record<PortIndex, FramePortData>>>;
  readonly items?: readonly ItemUpdate[];
}

/**
 * Written once, at the end of a cleanly-finished recording. Its absence
 * (together with `ReplayHeader.streamLength === 0`) means the recording
 * session was truncated, not that the match was unusually short.
 */
export interface GameEnd {
  readonly endReason: GameEndReason;
  /** Final stocks remaining, per port 0-3. -1 for a port never seated. */
  readonly placements: readonly [number, number, number, number];
}

export interface ReplayHeader {
  /** Format version. `3` for everything this package currently supports. */
  readonly version: number;
  /**
   * Byte length of the event stream following the header, as recorded in
   * the file. `0` means the recording session never cleanly finished (the
   * writer only patches this once, at close) — see `isComplete`.
   */
  readonly streamLength: number;
  /**
   * The recorded ROM's `GoodName` (mupen64plus-core's ROM database identity
   * string) - which specific ROM build produced this file. See
   * docs/RMGR_SPEC.md §3.3 for how this differs from `recorderSchemaVersion`.
   */
  readonly goodName: string;
  /**
   * Which revision of this recorder's understanding of `goodName`'s memory
   * layout produced this file - its own counter per `goodName`, not global.
   * See docs/RMGR_SPEC.md §3.3.
   */
  readonly recorderSchemaVersion: number;
  /**
   * Wall-clock time the recording started, seconds since the Unix epoch
   * (UTC) - independent of the filename's own timestamp (docs/RMGR_SPEC.md
   * §3.4), though the recorder writes the same instant to both.
   */
  readonly recordedAtEpochSeconds: number;
}

/** A fully parsed `.rmgr` file. */
export interface Replay {
  readonly header: ReplayHeader;
  readonly gameStart: GameStart;
  /** Sorted ascending by `frame`. */
  readonly frames: readonly Frame[];
  /** `null` if the recording session was truncated (see `isComplete`). */
  readonly gameEnd: GameEnd | null;
  /**
   * `true` when the header's `streamLength` was patched (i.e. nonzero) and
   * a `GameEnd` event is present — the recording session finished cleanly.
   * `false` for a crash/force-quit mid-match: still a valid, parseable,
   * truncated recording, just missing its ending.
   */
  readonly isComplete: boolean;
}

/**
 * The subset of `Replay` needed to serialize a file. `serializeReplay`
 * computes `header` and `isComplete` for you — you never fabricate them.
 */
export interface SerializableReplay {
  /** See `ReplayHeader.goodName`. Truncated if longer than `GOOD_NAME_WIDTH` (64) bytes once UTF-8 encoded. */
  readonly goodName: string;
  /** See `ReplayHeader.recorderSchemaVersion`. */
  readonly recorderSchemaVersion: number;
  /** See `ReplayHeader.recordedAtEpochSeconds`. */
  readonly recordedAtEpochSeconds: number;
  readonly gameStart: GameStart;
  readonly frames: readonly Frame[];
  /** Omit or pass `null` to write a file with no `GameEnd` event. */
  readonly gameEnd?: GameEnd | null;
}
