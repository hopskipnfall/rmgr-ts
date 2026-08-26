import { describe, expect, it } from "vitest";
import {
  ActionStateId,
  CharacterId,
  getActionStateName,
  getCharacterName,
  getGameDefinitions,
  getStageName,
  GoodName,
  isFoxCharacter,
  isGrabState,
  isJigglypuffCharacter,
  isLedgeState,
  isMarioCharacter,
  isNessCharacter,
  isShieldBreakState,
  isShieldState,
  isShieldStunState,
  isYoshiCharacter,
  StageId,
} from "../src/index.js";

describe("Character lookups", () => {
  it("resolves English and Japanese names for vanilla and remix characters", () => {
    expect(getCharacterName(CharacterId.Mario, "en")).toBe("Mario");
    expect(getCharacterName(CharacterId.Mario, "ja")).toBe("マリオ");

    expect(getCharacterName(CharacterId.Fox, "en")).toBe("Fox");
    expect(getCharacterName(CharacterId.Fox, "ja")).toBe("フォックス");

    expect(getCharacterName(CharacterId.Jigglypuff, "en")).toBe("Jigglypuff");
    expect(getCharacterName(CharacterId.Jigglypuff, "ja")).toBe("プリン");

    expect(getCharacterName(CharacterId.Ness, "en")).toBe("Ness");
    expect(getCharacterName(CharacterId.Ness, "ja")).toBe("ネス");

    expect(getCharacterName(CharacterId.Yoshi, "en")).toBe("Yoshi");
    expect(getCharacterName(CharacterId.Yoshi, "ja")).toBe("ヨッシー");

    expect(getCharacterName(CharacterId.Falco, "en")).toBe("Falco");
    expect(getCharacterName(CharacterId.Falco, "ja")).toBe("ファルコ");
  });

  it("handles fallback for unknown character IDs", () => {
    expect(getCharacterName(0x99, "en")).toBe("Character 0x99");
    expect(getCharacterName(0x99, "ja")).toBe("キャラクター 0x99");
  });

  it("identifies character variants across regional/polygon IDs", () => {
    expect(isJigglypuffCharacter(CharacterId.Jigglypuff)).toBe(true);
    expect(isJigglypuffCharacter(CharacterId.PolygonJigglypuff)).toBe(true);
    expect(isJigglypuffCharacter(CharacterId.JigglypuffJP)).toBe(true);
    expect(isJigglypuffCharacter(CharacterId.JigglypuffEU)).toBe(true);
    expect(isJigglypuffCharacter(CharacterId.Fox)).toBe(false);

    expect(isNessCharacter(CharacterId.Ness)).toBe(true);
    expect(isNessCharacter(CharacterId.PolygonNess)).toBe(true);
    expect(isNessCharacter(CharacterId.NessJP)).toBe(true);
    expect(isNessCharacter(CharacterId.Kirby)).toBe(false);

    expect(isYoshiCharacter(CharacterId.Yoshi)).toBe(true);
    expect(isYoshiCharacter(CharacterId.PolygonYoshi)).toBe(true);
    expect(isYoshiCharacter(CharacterId.YoshiJP)).toBe(true);
    expect(isYoshiCharacter(CharacterId.Link)).toBe(false);

    expect(isFoxCharacter(CharacterId.Fox)).toBe(true);
    expect(isFoxCharacter(CharacterId.PolygonFox)).toBe(true);
    expect(isFoxCharacter(CharacterId.FoxJP)).toBe(true);
    expect(isFoxCharacter(CharacterId.Mario)).toBe(false);

    expect(isMarioCharacter(CharacterId.Mario)).toBe(true);
    expect(isMarioCharacter(CharacterId.PolygonMario)).toBe(true);
    expect(isMarioCharacter(CharacterId.MarioJP)).toBe(true);
    expect(isMarioCharacter(CharacterId.Luigi)).toBe(false);
  });
});

describe("Stage lookups", () => {
  it("resolves English and Japanese stage names", () => {
    expect(getStageName(StageId.DreamLand, "en")).toBe("Dream Land");
    expect(getStageName(StageId.DreamLand, "ja")).toBe("プププランド");

    expect(getStageName(StageId.SectorZ, "en")).toBe("Sector Z");
    expect(getStageName(StageId.SectorZ, "ja")).toBe("セクターZ");

    expect(getStageName(StageId.HyruleCastle, "en")).toBe("Hyrule Castle");
    expect(getStageName(StageId.HyruleCastle, "ja")).toBe("ハイラル城");
  });

  it("handles fallback for unknown stage IDs", () => {
    expect(getStageName(0xfe, "en")).toBe("Stage 0xfe");
    expect(getStageName(0xfe, "ja")).toBe("ステージ 0xfe");
  });
});

describe("Action state lookups", () => {
  it("resolves English and Japanese action state names", () => {
    expect(getActionStateName(ActionStateId.Idle, "en")).toBe("Idle");
    expect(getActionStateName(ActionStateId.Idle, "ja")).toBe("待機");

    expect(getActionStateName(ActionStateId.Shield, "en")).toBe("Shield");
    expect(getActionStateName(ActionStateId.Shield, "ja")).toBe("ガード");

    expect(getActionStateName(ActionStateId.ShieldStun, "en")).toBe(
      "ShieldStun",
    );
    expect(getActionStateName(ActionStateId.ShieldStun, "ja")).toBe(
      "ガード硬直",
    );

    expect(getActionStateName(ActionStateId.ShieldBreakFly, "en")).toBe(
      "ShieldBreakFly",
    );
    expect(getActionStateName(ActionStateId.ShieldBreakFly, "ja")).toBe(
      "ガード割れふっとび",
    );

    expect(getActionStateName(ActionStateId.ThrowF, "en")).toBe("ThrowF");
    expect(getActionStateName(ActionStateId.ThrowF, "ja")).toBe("前投げ");
  });

  it("classifies action states accurately", () => {
    expect(isShieldState(ActionStateId.ShieldOn)).toBe(true);
    expect(isShieldState(ActionStateId.Shield)).toBe(true);
    expect(isShieldState(ActionStateId.ShieldOff)).toBe(true);
    expect(isShieldState(ActionStateId.ShieldStun)).toBe(true);
    expect(isShieldState(ActionStateId.Idle)).toBe(false);

    expect(isShieldStunState(ActionStateId.ShieldStun)).toBe(true);
    expect(isShieldStunState(ActionStateId.Shield)).toBe(false);

    expect(isShieldBreakState(ActionStateId.ShieldBreakFly)).toBe(true);
    expect(isShieldBreakState(ActionStateId.ShieldBreakFall)).toBe(true);
    expect(isShieldBreakState(ActionStateId.ShieldBreakDownBound)).toBe(true);
    expect(isShieldBreakState(ActionStateId.ShieldBreakStand)).toBe(true);
    expect(isShieldBreakState(ActionStateId.FuraFura)).toBe(true);
    expect(isShieldBreakState(ActionStateId.ShieldStun)).toBe(false);

    expect(isGrabState(ActionStateId.Grab)).toBe(true);
    expect(isGrabState(ActionStateId.GrabPull)).toBe(true);
    expect(isGrabState(ActionStateId.GrabWait)).toBe(true);
    expect(isGrabState(ActionStateId.ThrowF)).toBe(false);

    expect(isLedgeState(ActionStateId.CliffCatch)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffWait)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffQuick)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffClimbQuick2)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffClimbQuick3)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffSlow)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffClimbSlow2)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffClimbSlow3)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffAttackQuick)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffAttackQuick2)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffAttackSlow)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffAttackSlow2)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffEscapeQuick)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffEscapeQuick2)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffEscapeSlow)).toBe(true);
    expect(isLedgeState(ActionStateId.CliffEscapeSlow2)).toBe(true);
    expect(isLedgeState(ActionStateId.Fall)).toBe(false);
  });
});

describe("GoodName scoping", () => {
  it("getGameDefinitions returns scoped definitions", () => {
    const defs = getGameDefinitions(GoodName.SmashRemix2_0_1);
    expect(defs.goodName).toBe(GoodName.SmashRemix2_0_1);
    expect(defs.getCharacterName(CharacterId.Mario, "en")).toBe("Mario");
    expect(defs.getStageName(StageId.DreamLand, "en")).toBe("Dream Land");
  });

  it("top-level helpers accept goodName in options object", () => {
    expect(
      getCharacterName(CharacterId.Ness, {
        goodName: GoodName.SmashRemix2_0_1,
        lang: "ja",
      }),
    ).toBe("ネス");

    expect(
      getStageName(StageId.DreamLand, {
        goodName: GoodName.SmashRemix2_0_1,
        lang: "ja",
      }),
    ).toBe("プププランド");
  });
});
