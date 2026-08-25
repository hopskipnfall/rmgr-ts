import type { Frame, GameEnd, GameStart, PortIndex, PortSettings, SerializableReplay } from "../src/types.js";

export function makePortSettings(overrides: Partial<PortSettings> = {}): PortSettings {
  return {
    slotType: "human",
    characterId: 0,
    costumeId: 0,
    teamColor: 0,
    team: 0,
    handicap: 0,
    cpuLevel: 0,
    ...overrides,
  };
}

export function makeGameStart(overrides: Partial<GameStart> = {}): GameStart {
  return {
    stageId: 0x10,
    gameType: 2,
    stockCountSetting: 2,
    timeLimitMinutes: 100,
    damageRatio: 100,
    itemFrequency: 0,
    teamsEnabled: false,
    handicapMode: "off",
    ports: [
      makePortSettings({ slotType: "human", characterId: 0x0b }), // Ness
      makePortSettings({ slotType: "human", characterId: 0x01 }), // Fox
      makePortSettings({ slotType: "empty" }),
      makePortSettings({ slotType: "empty" }),
    ],
    playerNames: ["Alice", "Bob", "", ""],
    ...overrides,
  };
}

export function makeFrame(frameNumber: number, ports: readonly PortIndex[] = [0, 1]): Frame {
  const entry: { -readonly [K in PortIndex]?: Frame["ports"][K] } = {};
  for (const port of ports) {
    entry[port] = {
      pre: { frame: frameNumber, port, buttons: 0, stickX: 0, stickY: 0 },
      post: {
        frame: frameNumber,
        port,
        characterId: port === 0 ? 0x0b : 0x01,
        actionStateId: 0x00a,
        positionX: 0,
        positionY: 0,
        facingDirection: 1,
        velocityX: 0,
        velocityY: 0,
        damagePercent: 0,
        stocksRemaining: 2,
        jumpsUsed: 0,
        grounded: true,
        hurtboxState: 0,
        hitstunCounter: 0,
        actionFrameCounter: frameNumber,
        comboHitCount: 0,
        comboDamage: 0,
      },
    };
  }
  return { frame: frameNumber, ports: entry };
}

export function makeGameEnd(overrides: Partial<GameEnd> = {}): GameEnd {
  return {
    endReason: "normal",
    placements: [1, -1, -1, -1],
    ...overrides,
  };
}

export function makeReplay(overrides: Partial<SerializableReplay> = {}): SerializableReplay {
  return {
    goodName: "SmashRemix2.0.1",
    recorderSchemaVersion: 1,
    recordedAtEpochSeconds: 1_766_000_000,
    gameStart: makeGameStart(),
    frames: [makeFrame(0), makeFrame(1), makeFrame(2)],
    gameEnd: makeGameEnd(),
    ...overrides,
  };
}
