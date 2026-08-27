import { describe, expect, it } from "vitest";
import { parseReplay } from "../src/parse.js";
import { serializeReplay } from "../src/serialize.js";
import {
  makeFrame,
  makeGameEnd,
  makeGameStart,
  makeItemUpdate,
  makeReplay,
} from "./fixtures.js";

describe("serializeReplay -> parseReplay round trip", () => {
  it("preserves gameStart, frames, and gameEnd exactly for a typical match", () => {
    const input = makeReplay();
    const bytes = serializeReplay(input);
    const parsed = parseReplay(bytes);

    expect(parsed.gameStart).toEqual(input.gameStart);
    expect(parsed.frames).toEqual(input.frames);
    expect(parsed.gameEnd).toEqual(input.gameEnd);
    expect(parsed.header.version).toBe(3);
    expect(parsed.header.goodName).toBe(input.goodName);
    expect(parsed.header.recorderSchemaVersion).toBe(
      input.recorderSchemaVersion,
    );
    expect(parsed.header.recordedAtEpochSeconds).toBe(
      input.recordedAtEpochSeconds,
    );
    expect(parsed.isComplete).toBe(true);
  });

  it("round-trips teams/handicap match settings and per-port team/handicap/cpuLevel", () => {
    const input = makeReplay({
      gameStart: makeGameStart({
        teamsEnabled: true,
        handicapMode: "auto",
        ports: [
          {
            slotType: "human",
            characterId: 0x0b,
            costumeId: 0,
            teamColor: 0,
            team: 1,
            handicap: 15,
            cpuLevel: 0,
          },
          {
            slotType: "cpu",
            characterId: 0x01,
            costumeId: 2,
            teamColor: 1,
            team: 2,
            handicap: 30,
            cpuLevel: 9,
          },
          {
            slotType: "empty",
            characterId: 0,
            costumeId: 0,
            teamColor: 0,
            team: 0,
            handicap: 0,
            cpuLevel: 0,
          },
          {
            slotType: "empty",
            characterId: 0,
            costumeId: 0,
            teamColor: 0,
            team: 0,
            handicap: 0,
            cpuLevel: 0,
          },
        ],
      }),
    });
    const parsed = parseReplay(serializeReplay(input));

    expect(parsed.gameStart.teamsEnabled).toBe(true);
    expect(parsed.gameStart.handicapMode).toBe("auto");
    expect(parsed.gameStart.ports[0]).toMatchObject({
      team: 1,
      handicap: 15,
      cpuLevel: 0,
    });
    expect(parsed.gameStart.ports[1]).toMatchObject({
      team: 2,
      handicap: 30,
      cpuLevel: 9,
    });
  });

  it("round-trips a file with no GameEnd as an incomplete recording", () => {
    const input = makeReplay({ gameEnd: null });
    const parsed = parseReplay(serializeReplay(input));

    expect(parsed.gameEnd).toBeNull();
    expect(parsed.isComplete).toBe(false);
    expect(parsed.gameStart).toEqual(input.gameStart);
    expect(parsed.frames).toEqual(input.frames);
  });

  it("round-trips an offline match with no player names and no seated CPU/empty ports", () => {
    const input = makeReplay({
      gameStart: makeGameStart({
        playerNames: ["", "", "", ""],
        ports: [
          { slotType: "human", characterId: 0x00, costumeId: 0, teamColor: 0 },
          { slotType: "cpu", characterId: 0x07, costumeId: 2, teamColor: 1 },
          { slotType: "empty", characterId: 0, costumeId: 0, teamColor: 0 },
          { slotType: "empty", characterId: 0, costumeId: 0, teamColor: 0 },
        ],
      }),
      frames: [makeFrame(0, [0, 1])],
      gameEnd: makeGameEnd({
        endReason: "aborted",
        placements: [-1, -1, -1, -1],
      }),
    });
    const parsed = parseReplay(serializeReplay(input));

    expect(parsed.gameStart.playerNames).toEqual(["", "", "", ""]);
    expect(parsed.gameStart.ports[1].slotType).toBe("cpu");
    expect(parsed.gameEnd?.endReason).toBe("aborted");
  });

  it("round-trips ItemUpdate events, including multiple items on the same frame", () => {
    const items0 = [
      makeItemUpdate({
        frame: 0,
        objectAddress: 0x80123456,
        typeId: 0x05,
        positionX: 12.5,
        positionY: -3.25,
        positionZ: 0.75,
      }),
      makeItemUpdate({
        frame: 0,
        objectAddress: 0x80123500,
        typeId: 0x21,
      }),
    ];
    const input = makeReplay({
      frames: [makeFrame(0, [0, 1], items0), makeFrame(1, [0, 1])],
    });
    const bytes = serializeReplay(input);
    const parsed = parseReplay(bytes);

    expect(parsed.frames[0]?.items).toEqual(items0);
    expect(parsed.frames[1]?.items).toEqual([]);
  });

  it("round-trips negative facing direction, negative velocity, and non-grounded state", () => {
    const frame = makeFrame(5, [0]);
    const post = frame.ports[0]!.post;
    const input = makeReplay({
      frames: [
        {
          frame: 5,
          ports: {
            0: {
              pre: frame.ports[0]!.pre,
              post: {
                ...post,
                facingDirection: -1,
                velocityX: -12.5,
                velocityY: 3.25,
                grounded: false,
              },
            },
          },
          items: [],
        },
      ],
    });
    const parsed = parseReplay(serializeReplay(input));
    const parsedPost = parsed.frames[0]?.ports[0]?.post;

    expect(parsedPost?.facingDirection).toBe(-1);
    expect(parsedPost?.velocityX).toBeCloseTo(-12.5, 5);
    expect(parsedPost?.velocityY).toBeCloseTo(3.25, 5);
    expect(parsedPost?.grounded).toBe(false);
  });

  it("preserves frame order even if frames are passed out of order", () => {
    const input = makeReplay({
      frames: [makeFrame(2), makeFrame(0), makeFrame(1)],
    });
    const parsed = parseReplay(serializeReplay(input));
    expect(parsed.frames.map((f) => f.frame)).toEqual([0, 1, 2]);
  });

  it("round-trips a frame where only some ports are seated", () => {
    const input = makeReplay({
      frames: [makeFrame(0, [0]), makeFrame(1, [1, 3])],
    });
    const parsed = parseReplay(serializeReplay(input));

    expect(Object.keys(parsed.frames[0]!.ports)).toEqual(["0"]);
    expect(Object.keys(parsed.frames[1]!.ports).sort()).toEqual(["1", "3"]);
  });

  it("round-trips a match with zero recorded frames (e.g. aborted before the first frame)", () => {
    const input = makeReplay({
      frames: [],
      gameEnd: makeGameEnd({ endReason: "aborted" }),
    });
    const parsed = parseReplay(serializeReplay(input));
    expect(parsed.frames).toEqual([]);
    expect(parsed.gameEnd?.endReason).toBe("aborted");
  });

  it("preserves 32-character player names at exactly the field width", () => {
    const name32 = "abcdefghijklmnopqrstuvwxyz012345".slice(0, 32);
    expect(name32).toHaveLength(32);
    const input = makeReplay({
      gameStart: makeGameStart({ playerNames: [name32, "", "", ""] }),
    });
    const parsed = parseReplay(serializeReplay(input));
    expect(parsed.gameStart.playerNames[0]).toBe(name32);
  });
});
