import { describe, expect, it } from "vitest";
import { parseReplay } from "../src/parse.js";
import { serializeReplay } from "../src/serialize.js";
import {
  makeCoreOnlyReplay,
  makeFrame,
  makeItemUpdate,
  makeMatchEnd,
  makeMatchResult,
  makeMatchSettings,
  makeMatchStart,
  makeReplay,
} from "./fixtures.js";

describe("serializeReplay -> parseReplay round trip", () => {
  it("preserves matchStart, matchSettings, frames, matchEnd, matchResult exactly for a typical match", async () => {
    const input = makeReplay();
    const bytes = await serializeReplay(input);
    const parsed = await parseReplay(bytes);

    expect(parsed.matchStart).toEqual(input.matchStart);
    expect(parsed.matchSettings).toEqual(input.matchSettings);
    expect(parsed.frames).toEqual(input.frames);
    expect(parsed.matchEnd).toEqual(input.matchEnd);
    expect(parsed.matchResult).toEqual(input.matchResult);
    expect(parsed.header.version).toBe(5);
    expect(parsed.header.gameFamily).toBe(input.gameFamily);
    expect(parsed.header.goodName).toBe(input.goodName);
    expect(parsed.header.recorderSchemaVersion).toBe(
      input.recorderSchemaVersion,
    );
    expect(parsed.header.recordedAtEpochMillis).toBe(
      input.recordedAtEpochMillis,
    );
    expect(parsed.header.uncompressedLength).toBeGreaterThan(0);
    expect(parsed.header.compressedLength).toBeGreaterThan(0);
  });

  it("round-trips a core-only (unrecognized game) file with only InputFrame data", async () => {
    const input = makeCoreOnlyReplay();
    const parsed = await parseReplay(await serializeReplay(input));

    expect(parsed.header.gameFamily).toBe("");
    expect(parsed.matchSettings).toBeNull();
    expect(parsed.matchResult).toBeNull();
    expect(parsed.matchStart).toEqual(input.matchStart);
    for (const frame of parsed.frames) {
      for (const portData of Object.values(frame.ports)) {
        expect(portData?.state).toBeUndefined();
      }
    }
  });

  it("round-trips teams/handicap match settings and per-port team/handicap/cpuLevel", async () => {
    const input = makeReplay({
      matchSettings: makeMatchSettings({
        teamsEnabled: true,
        handicapMode: "auto",
        characterId: [0x0b, 0x01, 0, 0],
        costumeId: [0, 2, 0, 0],
        teamColor: [0, 1, 0, 0],
        portTeam: [1, 2, 0, 0],
        portHandicap: [15, 30, 0, 0],
        portCpuLevel: [0, 9, 0, 0],
      }),
    });
    const parsed = await parseReplay(await serializeReplay(input));

    expect(parsed.matchSettings?.teamsEnabled).toBe(true);
    expect(parsed.matchSettings?.handicapMode).toBe("auto");
    expect(parsed.matchSettings?.portTeam).toEqual([1, 2, 0, 0]);
    expect(parsed.matchSettings?.portHandicap).toEqual([15, 30, 0, 0]);
    expect(parsed.matchSettings?.portCpuLevel).toEqual([0, 9, 0, 0]);
  });

  it("round-trips an offline match with no player names and an aborted end", async () => {
    const input = makeReplay({
      matchStart: makeMatchStart({
        playerNames: ["", "", "", ""],
        slotType: ["human", "cpu", "empty", "empty"],
      }),
      frames: [makeFrame(0, [0, 1])],
      matchEnd: makeMatchEnd({ endReason: "aborted" }),
      matchResult: makeMatchResult({ placements: [-1, -1, -1, -1] }),
    });
    const parsed = await parseReplay(await serializeReplay(input));

    expect(parsed.matchStart.playerNames).toEqual(["", "", "", ""]);
    expect(parsed.matchStart.slotType[1]).toBe("cpu");
    expect(parsed.matchEnd.endReason).toBe("aborted");
  });

  it("round-trips ItemUpdate events, including multiple items on the same frame", async () => {
    const items0 = [
      makeItemUpdate({
        frame: 0,
        objectAddress: 0x80123456,
        linkId: 5, // Weapon
        kind: 0x07, // WPKind.Boomerang
        positionX: 12.5,
        positionY: -3.25,
        positionZ: 0.75,
      }),
      makeItemUpdate({
        frame: 0,
        objectAddress: 0x80123500,
        linkId: 4, // Item
        kind: 0x15, // ITKind.Bomb
      }),
    ];
    const input = makeReplay({
      frames: [makeFrame(0, [0, 1], items0), makeFrame(1, [0, 1])],
    });
    const bytes = await serializeReplay(input);
    const parsed = await parseReplay(bytes);

    expect(parsed.frames[0]?.items).toEqual(items0);
    expect(parsed.frames[1]?.items).toEqual([]);
  });

  it("round-trips StageHazardUpdate.hazardFlags, omitting the event on frames where it's 0", async () => {
    const input = makeReplay({
      frames: [
        { ...makeFrame(0, [0, 1]), hazardFlags: 0x01 },
        makeFrame(1, [0, 1]),
      ],
    });
    const bytes = await serializeReplay(input);
    const parsed = await parseReplay(bytes);

    expect(parsed.frames[0]?.hazardFlags).toBe(0x01);
    expect(parsed.frames[1]?.hazardFlags).toBe(0);
  });

  it("round-trips negative facing direction, negative velocity, and non-grounded state", async () => {
    const frame = makeFrame(5, [0]);
    const state = frame.ports[0]!.state!;
    const input = makeReplay({
      frames: [
        {
          frame: 5,
          ports: {
            0: {
              input: frame.ports[0]!.input,
              state: {
                ...state,
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
    const parsed = await parseReplay(await serializeReplay(input));
    const parsedState = parsed.frames[0]?.ports[0]?.state;

    expect(parsedState?.facingDirection).toBe(-1);
    expect(parsedState?.velocityX).toBeCloseTo(-12.5, 5);
    expect(parsedState?.velocityY).toBeCloseTo(3.25, 5);
    expect(parsedState?.grounded).toBe(false);
  });

  it("preserves frame order even if frames are passed out of order", async () => {
    const input = makeReplay({
      frames: [makeFrame(2), makeFrame(0), makeFrame(1)],
    });
    const parsed = await parseReplay(await serializeReplay(input));
    expect(parsed.frames.map((f) => f.frame)).toEqual([0, 1, 2]);
  });

  it("round-trips a frame where only some ports are seated", async () => {
    const input = makeReplay({
      frames: [makeFrame(0, [0]), makeFrame(1, [1, 3])],
    });
    const parsed = await parseReplay(await serializeReplay(input));

    expect(Object.keys(parsed.frames[0]!.ports)).toEqual(["0"]);
    expect(Object.keys(parsed.frames[1]!.ports).sort()).toEqual(["1", "3"]);
  });

  it("round-trips a match with zero recorded frames (e.g. aborted before the first frame)", async () => {
    const input = makeReplay({
      frames: [],
      matchEnd: makeMatchEnd({ endReason: "aborted", finalFrame: 0 }),
    });
    const parsed = await parseReplay(await serializeReplay(input));
    expect(parsed.frames).toEqual([]);
    expect(parsed.matchEnd.endReason).toBe("aborted");
  });

  it("preserves 32-character player names at exactly the field width", async () => {
    const name32 = "abcdefghijklmnopqrstuvwxyz012345".slice(0, 32);
    expect(name32).toHaveLength(32);
    const input = makeReplay({
      matchStart: makeMatchStart({ playerNames: [name32, "", "", ""] }),
    });
    const parsed = await parseReplay(await serializeReplay(input));
    expect(parsed.matchStart.playerNames[0]).toBe(name32);
  });
});
