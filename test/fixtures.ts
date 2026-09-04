import { SMASH_64_FAMILY } from "../src/constants.js";
import type {
  Frame,
  ItemUpdate,
  MatchEnd,
  MatchResult,
  MatchSettings,
  MatchStart,
  PortIndex,
  SerializableReplay,
} from "../src/types.js";

export function makeMatchStart(
  overrides: Partial<MatchStart> = {},
): MatchStart {
  return {
    playerNames: ["Alice", "Bob", "", ""],
    slotType: ["human", "human", "empty", "empty"],
    ...overrides,
  };
}

export function makeMatchSettings(
  overrides: Partial<MatchSettings> = {},
): MatchSettings {
  return {
    stageId: 0x10,
    gameType: 2,
    stockCountSetting: 2,
    timeLimitMinutes: 100,
    damageRatio: 100,
    itemFrequency: 0,
    teamsEnabled: false,
    handicapMode: "off",
    characterId: [0x0b, 0x01, 0, 0], // Ness, Fox
    costumeId: [0, 0, 0, 0],
    teamColor: [0, 0, 0, 0],
    portTeam: [0, 0, 0, 0],
    portHandicap: [0, 0, 0, 0],
    portCpuLevel: [0, 0, 0, 0],
    ...overrides,
  };
}

export function makeItemUpdate(
  overrides: Partial<ItemUpdate> = {},
): ItemUpdate {
  return {
    frame: 0,
    objectAddress: 0x80100000,
    linkId: 5, // Weapon
    kind: 0x00, // WPKind.Fireball
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    ...overrides,
  };
}

export function makeFrame(
  frameNumber: number,
  ports: readonly PortIndex[] = [0, 1],
  items: readonly ItemUpdate[] = [],
  hazardFlags = 0,
  familyRecognized = true,
): Frame {
  const entry: { -readonly [K in PortIndex]?: Frame["ports"][K] } = {};
  for (const port of ports) {
    entry[port] = {
      input: { frame: frameNumber, port, buttons: 0, stickX: 0, stickY: 0 },
      ...(familyRecognized
        ? {
            state: {
              frame: frameNumber,
              port,
              characterId: port === 0 ? 0x0b : 0x01,
              actionStateId: 0x00a,
              positionX: 0,
              positionY: 0,
              facingDirection: 1 as const,
              velocityX: 0,
              velocityY: 0,
              damagePercent: 0,
              stocksRemaining: 2,
              jumpsRemaining: 0,
              grounded: true,
              hurtboxState: 0,
              hitstunCounter: 0,
              actionFrameCounter: frameNumber,
              comboHitCount: 0,
              comboDamage: 0,
            },
          }
        : {}),
    };
  }
  return {
    frame: frameNumber,
    ports: entry,
    items,
    hazardFlags,
  };
}

export function makeMatchEnd(overrides: Partial<MatchEnd> = {}): MatchEnd {
  return {
    finalFrame: 2,
    endReason: "normal",
    ...overrides,
  };
}

export function makeMatchResult(
  overrides: Partial<MatchResult> = {},
): MatchResult {
  return {
    placements: [1, -1, -1, -1],
    ...overrides,
  };
}

export function makeReplay(
  overrides: Partial<SerializableReplay> = {},
): SerializableReplay {
  return {
    gameFamily: SMASH_64_FAMILY,
    goodName: "SmashRemix2.0.1",
    recorderSchemaVersion: 1,
    recordedAtEpochMillis: 1_766_000_000_000,
    matchStart: makeMatchStart(),
    matchSettings: makeMatchSettings(),
    frames: [makeFrame(0), makeFrame(1), makeFrame(2)],
    matchEnd: makeMatchEnd(),
    matchResult: makeMatchResult(),
    ...overrides,
  };
}

/** A core-only (unrecognized game) replay - no gameFamily/matchSettings/matchResult, and frames only ever carry `input`. */
export function makeCoreOnlyReplay(
  overrides: Partial<SerializableReplay> = {},
): SerializableReplay {
  return {
    goodName: "SomeOtherGame",
    recordedAtEpochMillis: 1_766_000_000_000,
    matchStart: makeMatchStart(),
    frames: [
      makeFrame(0, [0, 1], [], 0, false),
      makeFrame(1, [0, 1], [], 0, false),
      makeFrame(2, [0, 1], [], 0, false),
    ],
    matchEnd: makeMatchEnd(),
    ...overrides,
  };
}
