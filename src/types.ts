/**
 * Types for the RMG-K `.rmgr` replay file format, format version 5.
 *
 * These mirror the on-disk layout described in `docs/RMGR_SPEC.md` (in the
 * RMG-K repository) field-for-field. If you're changing a shape here, check
 * whether the spec (and the C++ writer in `Source/RMG-Core/Replay.cpp`)
 * needs to change too.
 *
 * Version 5 is a ground-up, breaking rewrite - see that spec's own status
 * note. There is no migration path from anything this package's earlier
 * versions read/wrote; this file no longer has any v4-and-earlier shapes to
 * carry forward.
 */

/** N64 controller port, 0-indexed. */
export type PortIndex = 0 | 1 | 2 | 3;

/** Wire values: 0 human, 1 CPU, 2 empty. */
export type SlotType = "human" | "cpu" | "empty";

/** Wire values: 0 aborted, 1 normal end. */
export type GameEndReason = "aborted" | "normal";

/** Wire values: 0 off, 1 on, 2 auto. */
export type HandicapMode = "off" | "on" | "auto";

/**
 * Core event, always present regardless of `ReplayHeader.gameFamily`.
 * Written exactly once, immediately after `EventPayloads`.
 *
 * Player display names are sourced from netplay room metadata, never from
 * any in-game name tag - an empty string for an offline match or an
 * unnamed port. Game-family-specific match settings (stage, character,
 * stock count, damage ratio, items, teams, handicap, CPU difficulty, ...)
 * are NOT part of this event - see `MatchSettings`.
 */
export interface MatchStart {
  readonly playerNames: readonly [string, string, string, string];
  /** Index = port number, 0-3. */
  readonly slotType: readonly [SlotType, SlotType, SlotType, SlotType];
}

/**
 * `smash64` game-family extension event. Present only when
 * `ReplayHeader.gameFamily === "smash64"`. Written exactly once,
 * immediately after `MatchStart`.
 */
export interface MatchSettings {
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
  readonly teamsEnabled: boolean;
  readonly handicapMode: HandicapMode;
  /** Index = port number, 0-3. Meaningless for a port whose `MatchStart.slotType` is `"empty"`. */
  readonly characterId: readonly [number, number, number, number];
  readonly costumeId: readonly [number, number, number, number];
  readonly teamColor: readonly [number, number, number, number];
  /** Only meaningful when `teamsEnabled` is true. */
  readonly portTeam: readonly [number, number, number, number];
  /** Only meaningful when `handicapMode !== "off"`. */
  readonly portHandicap: readonly [number, number, number, number];
  /** Meaningless for a `"human"` port. */
  readonly portCpuLevel: readonly [number, number, number, number];
  /**
   * Recorder schema 3+ (absent for schema 1/2 files, whose `MatchSettings`
   * is 32 bytes and ends after `portCpuLevel`). `sSYUtilsRandomSeed`
   * (vanilla SSB64 code, unmodified by Remix) captured once at match
   * start. Paired with this match's recorded `InputFrame` events, it's
   * sufficient to reproduce this match's RNG-dependent outcomes (item
   * spawn rolls, move variance, Whispy Woods' wind timing, ...) when
   * replaying from inputs - see `docs/RMGR_SPEC.md` §5.1.
   */
  readonly rngSeed?: number;
  /**
   * Remix's `Toggles.asm` menu-configured mutators - match properties
   * captured once alongside the rest of `MatchSettings`, not per-frame
   * data. Recorder schema 3+ (absent for schema 1/2 files). Every value
   * is a raw enum/flag number - see `RemixGameplaySettingValue`/
   * `RemixStageSettingValue` and `getRemixSettingValueName()` in
   * `lookups.ts` for what each value means, and `docs/RMGR_SPEC.md`
   * §5.1.1/§5.1.2 for the source tables.
   */
  readonly gameplaySettings?: RemixGameplaySettings;
  /** See `gameplaySettings`. Recorder schema 3+ (absent for schema 1/2 files). */
  readonly stageSettings?: RemixStageSettings;
}

/**
 * The 31 Gameplay Settings from Remix's `Toggles.asm` - `MatchSettings`
 * recorder schema 3+. Field order matches the wire layout
 * (`docs/RMGR_SPEC.md` §5.1); every value is a raw enum/flag number - see
 * `getRemixSettingValueName()` in `lookups.ts` for what each value means.
 */
export interface RemixGameplaySettings {
  readonly hitstun: number;
  readonly hitlag: number;
  readonly di: number;
  readonly japaneseSounds: number;
  readonly japaneseStunSleep: number;
  readonly momentumSlide: number;
  readonly shieldStun: number;
  readonly zCancel: number;
  readonly punishFailedZCancel: number;
  readonly improvedAI: number;
  readonly tripping: number;
  readonly rage: number;
  readonly footstoolJumping: number;
  readonly airDodging: number;
  readonly jabLocking: number;
  readonly edgeCJumping: number;
  readonly perfectShielding: number;
  readonly parrying: number;
  readonly spotDodging: number;
  readonly fastFallAerials: number;
  readonly ledgeTrumping: number;
  readonly wallTeching: number;
  readonly chargeSmashes: number;
  readonly itemContainers: number;
  readonly gameSpeed: number;
  readonly specialZoom: number;
  readonly blastzoneWarp: number;
  readonly singleButtonMode: number;
  readonly allItemsRDropAerial: number;
  readonly moveStaling: number;
  readonly stopwatchItem: number;
}

/**
 * The 8 (core) Stage Settings from Remix's `Toggles.asm` - `MatchSettings`
 * recorder schema 3+. See `RemixGameplaySettings`'s doc comment.
 */
export interface RemixStageSettings {
  readonly stageSelectLayout: number;
  readonly hazardMode: number;
  readonly whispyMode: number;
  readonly saffronPokemonRate: number;
  readonly pokemonAnnouncer: number;
  readonly dragonKingHUD: number;
  readonly cameraMode: number;
  readonly yoshiIslandCloudAnims: number;
}

/**
 * Core event. Input-side data for one port, one frame - captured before
 * that frame's inputs are processed. Uses the game's already-processed
 * button/stick values, which are available uniformly for both human and CPU
 * ports.
 */
export interface InputFrame {
  /** 0 at the first frame this match's recording enters the "ongoing" state. */
  readonly frame: number;
  readonly port: PortIndex;
  /** Processed button bitmask — see `ButtonBit` in `constants.ts`. */
  readonly buttons: number;
  readonly stickX: number;
  readonly stickY: number;
}

/**
 * `smash64` game-family extension event. State-side data for one port, one
 * frame - captured after that frame's physics/collision resolution.
 */
export interface StateFrame {
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
  /** `jumpsMax` (per-character) minus the fighter's used-jump counter. `0` through most of a grounded match is normal (jumps reset on landing). */
  readonly jumpsRemaining: number;
  readonly grounded: boolean;
  /**
   * The motion-script hit status (`GMHitStatus`): `0` hurtboxes off, `1`
   * normal, `2` invincible (can be hit, takes no damage/knockback), `3`
   * intangible (can't be hit) - dodges, rolls and ledge-grab intangibility.
   * Respawn invincibility is separate: `specialHitStatus`. Super Star item
   * invincibility isn't recorded.
   */
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
   * actual combo. Zeroes the instant the chain breaks.
   */
  readonly comboHitCount: number;
  /** Running damage dealt within the same chain as `comboHitCount`; zeroes at the same instant. */
  readonly comboDamage: number;
  /**
   * The fighter's render scale (root joint scale x/y) - recorder schema 2+;
   * absent for files whose `StateFrame` is the original 50-byte layout. `1.0`
   * x Remix's Giant/Tiny setting normally, `0` if the recorder couldn't read
   * it. Remix also derives the ECB and ledge-grab reach from this size, and
   * Kirby's aerial up-B can leave it stuck above 1.0 until he respawns.
   */
  readonly scaleX?: number;
  readonly scaleY?: number;
  /**
   * Per-character hidden state - recorder schema 2+ (docs/RMGR_SPEC.md §5.2).
   * Samus: stored Charge Shot level 0-7. DK: stored Giant Punch charge
   * 0-10. Kirby: copied fighter's character ID, `8` (Kirby) = none. Not
   * meaningful for other characters.
   */
  readonly characterSpecific?: number;
  /** Shield health - recorder schema 2+. */
  readonly shieldHealth?: number;
  /**
   * Hit status (values as `hurtboxState`) from the timed counters - recorder
   * schema 2+. `2` during respawn invincibility, `3` during wall-bounce or
   * while trapped in Yoshi's egg.
   */
  readonly specialHitStatus?: number;
  /**
   * Temporary knockback armor (knockback units subtracted from incoming
   * knockback) - recorder schema 2+. Nonzero only during Yoshi's double jump
   * among the original 12; `0` = none.
   */
  readonly knockbackResist?: number;
}

/**
 * One seated port's frame data for a single frame. `state` is only present
 * when the file's `gameFamily` is a recognized family - a core-only
 * (unrecognized game) recording has `input` alone.
 */
export interface FramePortData {
  readonly input: InputFrame;
  readonly state?: StateFrame;
}

/**
 * `smash64` game-family extension event. One live Item or Weapon object on
 * the shared `GObj` list, for a single frame — see `docs/RMGR_SPEC.md`
 * §5.3. "Weapon" is a free-flying character special-move projectile
 * (boomerang, fireball, ...); "Item" covers thrown/spawned items and hazard
 * objects, including some fighter-held things like Link's pulled bomb.
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
  /** `4` = Item, `5` = Weapon — which enum `kind` is a value from. See `ItemLinkId` in `lookups.ts`. */
  readonly linkId: number;
  /** `ITKind` (`linkId === 4`) or `WPKind` (`linkId === 5`) — the real, named per-instance type. See `getItemKindName()` in `lookups.ts`. */
  readonly kind: number;
  readonly positionX: number;
  readonly positionY: number;
  readonly positionZ: number;
  /**
   * The object's render scale (its DObj's scale x/y) - recorder schema 2+.
   * Absent for files whose `ItemUpdate` is the original 25-byte layout
   * (recorder schema 1). Constant for most objects; Samus's Charge Shot grows
   * with charge, `gfx_size / 30` per charge level (docs/RMGR_SPEC.md §5.3).
   */
  readonly scaleX?: number;
  readonly scaleY?: number;
}

/**
 * One recorded frame. `ports` only has entries for ports that were seated
 * and live that frame — never assume all four are present. `items` is
 * every `ItemUpdate` recorded for this frame (empty for a core-only file,
 * or a frame with none live), in the order they appeared in the file.
 * `hazardFlags` is the raw `StageHazardUpdate` bitmask for this frame (see
 * `HazardFlag`/`hasHazardFlag` in `constants.ts`) — `0`/absent means no
 * tracked hazard is active. Both are declared optional only so code that
 * hand-constructs a `Frame` isn't forced to specify them; treat a missing
 * value the same as empty/`0`.
 */
export interface Frame {
  readonly frame: number;
  readonly ports: Readonly<Partial<Record<PortIndex, FramePortData>>>;
  readonly items?: readonly ItemUpdate[];
  readonly hazardFlags?: number;
}

/** Core event. Written exactly once, as the last event in the stream. */
export interface MatchEnd {
  /** The last `frame` value seen in any `InputFrame` event this match. */
  readonly finalFrame: number;
  readonly endReason: GameEndReason;
}

/**
 * `smash64` game-family extension event. Written exactly once, immediately
 * after `MatchEnd`.
 */
export interface MatchResult {
  /** Final stocks remaining, per port 0-3. -1 for a port never seated. */
  readonly placements: readonly [number, number, number, number];
}

export interface ReplayHeader {
  /** Format version. `5` for everything this package currently supports - a total break from any earlier version, no migration path. */
  readonly version: number;
  /**
   * Which game-family extension event set applies - `""` if the ROM that
   * produced this file wasn't recognized by its recorder (a valid,
   * core-only file in that case). See `docs/RMGR_SPEC.md` §2.1/§3.2.
   */
  readonly gameFamily: string;
  /** The recorded ROM's `GoodName` (mupen64plus-core's ROM database identity string) - which specific ROM build produced this file. */
  readonly goodName: string;
  /** Which revision of this recorder's understanding of `goodName`'s memory layout produced this file - its own counter per `goodName`, not global. `0` when `gameFamily` is `""`. */
  readonly recorderSchemaVersion: number;
  /** Wall-clock time the recording started, milliseconds since the Unix epoch (UTC). */
  readonly recordedAtEpochMillis: number;
  /** Byte length of the event stream after decompression, as recorded in the file. */
  readonly uncompressedLength: number;
  /** Byte length of the deflate-compressed block following the header, as recorded in the file. */
  readonly compressedLength: number;
}

/** A fully parsed `.rmgr` file. */
export interface Replay {
  readonly header: ReplayHeader;
  readonly matchStart: MatchStart;
  /** `null` when `header.gameFamily` is `""` (unrecognized game - core-only file). */
  readonly matchSettings: MatchSettings | null;
  /** Sorted ascending by `frame`. */
  readonly frames: readonly Frame[];
  readonly matchEnd: MatchEnd;
  /** `null` when `header.gameFamily` is `""` (unrecognized game - core-only file). */
  readonly matchResult: MatchResult | null;
}

/**
 * The subset of `Replay` needed to serialize a file. `serializeReplay`
 * computes `header` for you — you never fabricate it. Pass `gameFamily`
 * (and `matchSettings`/`matchResult`) to write a `smash64`-family file;
 * omit all three (or pass `gameFamily: ""`) for a core-only file.
 */
export interface SerializableReplay {
  /** See `ReplayHeader.gameFamily`. Omit or pass `""` for a core-only file - `matchSettings`/`matchResult` must then be omitted/null too. */
  readonly gameFamily?: string;
  /** See `ReplayHeader.goodName`. Truncated if longer than 64 bytes once UTF-8 encoded. */
  readonly goodName: string;
  /** See `ReplayHeader.recorderSchemaVersion`. Defaults to `0`. */
  readonly recorderSchemaVersion?: number;
  /** See `ReplayHeader.recordedAtEpochMillis`. */
  readonly recordedAtEpochMillis: number;
  readonly matchStart: MatchStart;
  readonly matchSettings?: MatchSettings | null;
  readonly frames: readonly Frame[];
  readonly matchEnd: MatchEnd;
  readonly matchResult?: MatchResult | null;
}
