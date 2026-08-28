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
  /**
   * `jumpsMax` (per-character) minus the fighter's used-jump counter.
   * Named/interpreted as `jumpsUsed` through schema v6 - that read a
   * constant `0` for an entire match, every port, regardless of real jump
   * activity (a wrong-width memory read on RMG-K's side - see
   * `docs/RMGR_SPEC.md` §5's v6→v7 note). Schema v6 and earlier files'
   * byte here is meaningless, not real data. `0` through most of a
   * grounded match is normal even in a correct v7+ file (jumps reset to 0
   * on landing) - it isn't itself a sign of the old bug.
   */
  readonly jumpsRemaining: number;
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
 * One live Item or Weapon object on the shared `GObj` list, for a single
 * frame — see `docs/RMGR_SPEC.md` §4.6. "Weapon" is a free-flying character
 * special-move projectile (boomerang, fireball, ...); "Item" covers
 * thrown/spawned items and hazard objects, including some fighter-held
 * things like Link's pulled bomb. Absent (empty `Frame.items`) in a file
 * recorded before schema v2 — see `ReplayHeader.recorderSchemaVersion`.
 *
 * **Schema v2 files' `ItemUpdate` data is not usable** — that schema had a
 * single `typeId` field read from the wrong offset, producing a large,
 * meaningless, constantly-changing value instead of a real type. Schema v3
 * replaced it with `linkId`/`kind` below. This package only parses/writes
 * the v3 shape; `parseReplay` throws on an older `ItemUpdate` payload size
 * rather than silently returning garbage - see `docs/RMGR_SPEC.md` §5's
 * recorder schema history for the full story.
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
  /** `4` = Item, `5` = Weapon — which enum `kind` is a value from. See `ItemLinkId` in `lookups.ts` and `docs/RMGR_SPEC.md` §7.6. */
  readonly linkId: number;
  /**
   * `ITKind` (`linkId === 4`) or `WPKind` (`linkId === 5`) — the real,
   * named per-instance type. See `getItemKindName()` in `lookups.ts` to
   * resolve this to a display string, and `docs/RMGR_SPEC.md` §7.6 for both
   * enums.
   */
  readonly kind: number;
  readonly positionX: number;
  readonly positionY: number;
  /** Confirmed exactly against a real SSB64 decompilation — see `docs/RMGR_SPEC.md` §4.6. */
  readonly positionZ: number;
}

/**
 * One currently-active hitbox slot for a single frame — a fighter's own
 * attack (`FTAttackColl`, 4 slots/fighter) or an item's/weapon's attack
 * (`ITAttackColl`/`WPAttackColl`, 2 slots each). Absent (empty
 * `Frame.hitboxes`) in a file recorded before schema v5. See
 * `docs/RMGR_SPEC.md` §4.8.
 *
 * Deliberately verbose and temporary: recorded for every active slot, every
 * frame, with no deduplication against action state — the plan is to keep
 * doing that only until it's confirmed that a character's hitbox geometry
 * is reliably derivable from `(characterId, actionStateId,
 * actionFrameCounter)` alone, at which point recording can stop for that
 * character. See `docs/RMGR_SPEC.md` §8.
 *
 * **Confidence caveat:** `ownerKind === "fighter"` fields are high
 * confidence (confirmed via real Remix ASM call sites and the decomp,
 * agreeing exactly). `"item"`/`"weapon"` fields have high-confidence field
 * *order* but hand-derived, not compiler-verified, byte *offsets* — see
 * `docs/RMGR_SPEC.md` §4.8's own caveat.
 */
export interface HitboxUpdate {
  readonly frame: number;
  /** Which struct this came from, and how `ownerId` below is interpreted. */
  readonly ownerKind: "fighter" | "item" | "weapon";
  /**
   * `ownerKind === "fighter"`: the port (0-3). Otherwise: the owning
   * `GObj`'s own RDRAM address — the same identity as
   * `ItemUpdate.objectAddress`, so a `HitboxUpdate` can be correlated to
   * that frame's `ItemUpdate` for the same live object.
   */
  readonly ownerId: number;
  /** Fighter: 0-3. Item/Weapon: 0-1. */
  readonly slotIndex: number;
  /** `1` = fresh (became active this frame), `2` = transfer, `3` = interpolate. Never `0` — a disabled slot is never returned. */
  readonly attackState: number;
  readonly damage: number;
  /** World-space, already transformed. */
  readonly positionX: number;
  readonly positionY: number;
  readonly positionZ: number;
  /** Radius — hitboxes are spheres, not boxes. */
  readonly size: number;
  /** Knockback angle. */
  readonly angle: number;
  readonly knockbackScale: number;
  readonly knockbackWeight: number;
  readonly knockbackBase: number;
  readonly element: number;
  readonly shieldDamage: number;
}

/**
 * One hurtbox slot on a fighter's body for a single frame (`FTDamageColl`,
 * 11 slots/fighter, one per body region). Fighter-only — items/weapons have
 * at most a single *static*, per-type hurtbox template with no live
 * per-instance data traced yet. Absent (empty `Frame.hurtboxes`) in a file
 * recorded before schema v5. See `docs/RMGR_SPEC.md` §4.9.
 *
 * **Unlike `HitboxUpdate`/`ItemUpdate`, this is NOT sparse** — a seated
 * port's 11 slots are (almost) always all present every frame, since
 * hurtboxes exist essentially continuously while a fighter is alive.
 * Same "deliberately verbose and temporary" rationale as `HitboxUpdate` —
 * see its doc comment and `docs/RMGR_SPEC.md` §8.
 */
export interface HurtboxUpdate {
  readonly frame: number;
  readonly port: PortIndex;
  /** 0-10. */
  readonly slotIndex: number;
  /**
   * Per-bone Vulnerable/Invincible/Intangible. Raw value — the exact
   * numeric mapping for this *per-bone* field isn't independently confirmed
   * the way the whole-character convention is
   * (`PostFrameUpdate.hurtboxState`, `3` = intangible).
   */
  readonly hitStatus: number;
  /** `0` = low, `1` = middle, `2` = high. */
  readonly placement: number;
  readonly isGrabbable: boolean;
  /**
   * **Approximation, not the true hurtbox center** — the bone's own
   * world-space joint position. Does NOT apply `offsetX/Y/Z` below or the
   * bone's rotation on top.
   */
  readonly positionX: number;
  readonly positionY: number;
  readonly positionZ: number;
  /** Authored, bone-relative, untransformed. */
  readonly offsetX: number;
  readonly offsetY: number;
  readonly offsetZ: number;
  /** Anisotropic — unlike a hitbox's single `size` radius. */
  readonly sizeX: number;
  readonly sizeY: number;
  readonly sizeZ: number;
}

/**
 * One recorded frame. `ports` only has entries for ports that were seated
 * and live that frame — never assume all four are present. `items` is
 * every `ItemUpdate` recorded for this frame, in the order they appeared in
 * the file. `parseReplay` always returns an array here (empty if nothing
 * was live that frame, or if this file predates recorder schema v3 - see
 * `ItemUpdate`'s own doc comment for why schema v2 doesn't count) —
 * declared optional only so code that hand-constructs a `Frame` (tests,
 * older callers) isn't forced to specify it; treat a missing `items` the
 * same as an empty array. `hazardFlags` is the raw `StageHazardUpdate`
 * bitmask for this frame (see `HazardFlag`/`hasHazardFlag` in
 * `constants.ts`) — `0`/absent means no tracked hazard is active, which is
 * indistinguishable from "this file predates schema v3" from `Frame` alone;
 * check `ReplayHeader.recorderSchemaVersion` if that distinction matters.
 * `hitboxes`/`hurtboxes` are every `HitboxUpdate`/`HurtboxUpdate` recorded
 * for this frame (empty before schema v5) — same "optional field defaults
 * to empty array" treatment as `items`.
 */
export interface Frame {
  readonly frame: number;
  readonly ports: Readonly<Partial<Record<PortIndex, FramePortData>>>;
  readonly items?: readonly ItemUpdate[];
  readonly hazardFlags?: number;
  readonly hitboxes?: readonly HitboxUpdate[];
  readonly hurtboxes?: readonly HurtboxUpdate[];
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
   * Wall-clock time the recording started, milliseconds since the Unix
   * epoch (UTC) - independent of the filename's own timestamp
   * (docs/RMGR_SPEC.md §3.4), though the recorder writes the same instant
   * to both (truncated to whole seconds there).
   */
  readonly recordedAtEpochMillis: number;
  /**
   * Nanosecond offset within `recordedAtEpochMillis`'s millisecond, for
   * finer-than-millisecond alignment across multiple recordings from the
   * same session. Range 0-999999. Best-effort - `0` means either exactly on
   * the millisecond boundary or, more commonly, that the recorder had no
   * sub-millisecond precision to offer for this particular file (see
   * docs/RMGR_SPEC.md §3.1/§3.4).
   */
  readonly recordedAtNanosOffset: number;
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
  /** See `ReplayHeader.recordedAtEpochMillis`. */
  readonly recordedAtEpochMillis: number;
  /** See `ReplayHeader.recordedAtNanosOffset`. Optional - defaults to `0`. */
  readonly recordedAtNanosOffset?: number;
  readonly gameStart: GameStart;
  readonly frames: readonly Frame[];
  /** Omit or pass `null` to write a file with no `GameEnd` event. */
  readonly gameEnd?: GameEnd | null;
}
