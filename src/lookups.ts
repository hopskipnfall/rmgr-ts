/**
 * Display names, IDs, constants, and classifications for characters, stages,
 * and action states across supported games/mods (scoped by goodName).
 *
 * Source: docs/RMGR_SPEC.md sections 7.1-7.3.
 */

export type Language = "en" | "ja";

export const GoodName = {
  SmashRemix2_0_1: "SmashRemix2.0.1",
  SuperSmashBros_U: "SuperSmashBros (U)",
  SuperSmashBros_J: "SuperSmashBros (J)",
  SuperSmashBros_E: "SuperSmashBros (E)",
} as const;

export type GoodName = (typeof GoodName)[keyof typeof GoodName] | string;

export const CharacterId = {
  // Vanilla (0x00-0x1C)
  Mario: 0x00,
  Fox: 0x01,
  DonkeyKong: 0x02,
  Samus: 0x03,
  Luigi: 0x04,
  Link: 0x05,
  Yoshi: 0x06,
  CaptainFalcon: 0x07,
  Kirby: 0x08,
  Pikachu: 0x09,
  Jigglypuff: 0x0a,
  Ness: 0x0b,
  MasterHand: 0x0c,
  MetalMario: 0x0d,
  PolygonMario: 0x0e,
  PolygonFox: 0x0f,
  PolygonDK: 0x10,
  PolygonSamus: 0x11,
  PolygonLuigi: 0x12,
  PolygonLink: 0x13,
  PolygonYoshi: 0x14,
  PolygonFalcon: 0x15,
  PolygonKirby: 0x16,
  PolygonPikachu: 0x17,
  PolygonJigglypuff: 0x18,
  PolygonNess: 0x19,
  GiantDK: 0x1a,
  Random: 0x1b,

  // Remix fighters (0x1D-0x4C)
  Falco: 0x1d,
  Ganondorf: 0x1e,
  YoungLink: 0x1f,
  DrMario: 0x20,
  Wario: 0x21,
  DarkSamus: 0x22,
  LinkEU: 0x23,
  SamusJP: 0x24,
  NessJP: 0x25,
  Lucas: 0x26,
  LinkJP: 0x27,
  FalconJP: 0x28,
  FoxJP: 0x29,
  MarioJP: 0x2a,
  LuigiJP: 0x2b,
  DKJP: 0x2c,
  PikachuEU: 0x2d,
  JigglypuffJP: 0x2e,
  JigglypuffEU: 0x2f,
  KirbyJP: 0x30,
  YoshiJP: 0x31,
  PikachuJP: 0x32,
  SamusEU: 0x33,
  Bowser: 0x34,
  GigaBowser: 0x35,
  Piano: 0x36,
  Wolf: 0x37,
  Conker: 0x38,
  Mewtwo: 0x39,
  Marth: 0x3a,
  Sonic: 0x3b,
  Sandbag: 0x3c,
  SuperSonic: 0x3d,
  Sheik: 0x3e,
  Marina: 0x3f,
  KingDedede: 0x40,
  Goemon: 0x41,
  Peppy: 0x42,
  Slippy: 0x43,
  Banjo: 0x44,
  MetalLuigi: 0x45,
  Ebisumaru: 0x46,
  DragonKing: 0x47,
  Crash: 0x48,
  Peach: 0x49,
  Roy: 0x4a,
  DrLuigi: 0x4b,
  LankyKong: 0x4c,

  // Remix polygons (0x4D-0x60)
  PolygonWario: 0x4d,
  PolygonLucas: 0x4e,
  PolygonBowser: 0x4f,
  PolygonWolf: 0x50,
  PolygonDrMario: 0x51,
  PolygonSonic: 0x52,
  PolygonSheik: 0x53,
  PolygonMarina: 0x54,
  PolygonFalco: 0x55,
  PolygonGanondorf: 0x56,
  PolygonDarkSamus: 0x57,
  PolygonMarth: 0x58,
  PolygonMewtwo: 0x59,
  PolygonDedede: 0x5a,
  PolygonYoungLink: 0x5b,
  PolygonGoemon: 0x5c,
  PolygonConker: 0x5d,
  PolygonBanjo: 0x5e,
  PolygonPeach: 0x5f,
  PolygonCrash: 0x60,
} as const;

export type CharacterId = (typeof CharacterId)[keyof typeof CharacterId];

export type CharacterGroup = "na" | "jp" | "remix";

/**
 * The original 12 North America release characters (NTSC-U / 0x00-0x0b).
 */
export const NA_ORIGINAL_12_IDS: readonly number[] = [
  CharacterId.Mario, // 0x00
  CharacterId.Fox, // 0x01
  CharacterId.DonkeyKong, // 0x02
  CharacterId.Samus, // 0x03
  CharacterId.Luigi, // 0x04
  CharacterId.Link, // 0x05
  CharacterId.Yoshi, // 0x06
  CharacterId.CaptainFalcon, // 0x07
  CharacterId.Kirby, // 0x08
  CharacterId.Pikachu, // 0x09
  CharacterId.Jigglypuff, // 0x0a
  CharacterId.Ness, // 0x0b
];

/**
 * The original 12 Japan release characters (NTSC-J mechanics / 12 J variants in Remix).
 */
export const JP_ORIGINAL_12_IDS: readonly number[] = [
  CharacterId.MarioJP, // 0x2a
  CharacterId.FoxJP, // 0x29
  CharacterId.DKJP, // 0x2c
  CharacterId.SamusJP, // 0x24
  CharacterId.LuigiJP, // 0x2b
  CharacterId.LinkJP, // 0x27
  CharacterId.YoshiJP, // 0x31
  CharacterId.FalconJP, // 0x28
  CharacterId.KirbyJP, // 0x30
  CharacterId.PikachuJP, // 0x32
  CharacterId.JigglypuffJP, // 0x2e
  CharacterId.NessJP, // 0x25
];

export function isNAOriginal12Id(id: number): boolean {
  return id >= 0x00 && id <= 0x0b;
}

export function isJPOriginal12Id(id: number): boolean {
  return (
    id === CharacterId.MarioJP ||
    id === CharacterId.FoxJP ||
    id === CharacterId.DKJP ||
    id === CharacterId.SamusJP ||
    id === CharacterId.LuigiJP ||
    id === CharacterId.LinkJP ||
    id === CharacterId.YoshiJP ||
    id === CharacterId.FalconJP ||
    id === CharacterId.KirbyJP ||
    id === CharacterId.PikachuJP ||
    id === CharacterId.JigglypuffJP ||
    id === CharacterId.NessJP
  );
}

export function getCharacterGroupId(id: number): CharacterGroup {
  if (isNAOriginal12Id(id)) return "na";
  if (isJPOriginal12Id(id)) return "jp";
  return "remix";
}

export const CHARACTER_NAMES: Readonly<Record<number, string>> = {
  0x00: "Mario",
  0x01: "Fox",
  0x02: "Donkey Kong",
  0x03: "Samus",
  0x04: "Luigi",
  0x05: "Link",
  0x06: "Yoshi",
  0x07: "Captain Falcon",
  0x08: "Kirby",
  0x09: "Pikachu",
  0x0a: "Jigglypuff",
  0x0b: "Ness",
  0x0c: "Master Hand",
  0x0d: "Metal Mario",
  0x0e: "Polygon Mario",
  0x0f: "Polygon Fox",
  0x10: "Polygon DK",
  0x11: "Polygon Samus",
  0x12: "Polygon Luigi",
  0x13: "Polygon Link",
  0x14: "Polygon Yoshi",
  0x15: "Polygon Falcon",
  0x16: "Polygon Kirby",
  0x17: "Polygon Pikachu",
  0x18: "Polygon Jigglypuff",
  0x19: "Polygon Ness",
  0x1a: "Giant DK",
  0x1b: "Random",
  0x1d: "Falco",
  0x1e: "Ganondorf",
  0x1f: "Young Link",
  0x20: "Dr. Mario",
  0x21: "Wario",
  0x22: "Dark Samus",
  0x23: "Link (EU)",
  0x24: "Samus (JP)",
  0x25: "Ness (JP)",
  0x26: "Lucas",
  0x27: "Link (JP)",
  0x28: "Falcon (JP)",
  0x29: "Fox (JP)",
  0x2a: "Mario (JP)",
  0x2b: "Luigi (JP)",
  0x2c: "DK (JP)",
  0x2d: "Pikachu (EU)",
  0x2e: "Jigglypuff (JP)",
  0x2f: "Jigglypuff (EU)",
  0x30: "Kirby (JP)",
  0x31: "Yoshi (JP)",
  0x32: "Pikachu (JP)",
  0x33: "Samus (EU)",
  0x34: "Bowser",
  0x35: "Giga Bowser",
  0x36: "Piano",
  0x37: "Wolf",
  0x38: "Conker",
  0x39: "Mewtwo",
  0x3a: "Marth",
  0x3b: "Sonic",
  0x3c: "Sandbag",
  0x3d: "Super Sonic",
  0x3e: "Sheik",
  0x3f: "Marina",
  0x40: "King Dedede",
  0x41: "Goemon",
  0x42: "Peppy",
  0x43: "Slippy",
  0x44: "Banjo",
  0x45: "Metal Luigi",
  0x46: "Ebisumaru",
  0x47: "Dragon King",
  0x48: "Crash",
  0x49: "Peach",
  0x4a: "Roy",
  0x4b: "Dr. Luigi",
  0x4c: "Lanky Kong",
  0x4d: "Polygon Wario",
  0x4e: "Polygon Lucas",
  0x4f: "Polygon Bowser",
  0x50: "Polygon Wolf",
  0x51: "Polygon Dr. Mario",
  0x52: "Polygon Sonic",
  0x53: "Polygon Sheik",
  0x54: "Polygon Marina",
  0x55: "Polygon Falco",
  0x56: "Polygon Ganondorf",
  0x57: "Polygon Dark Samus",
  0x58: "Polygon Marth",
  0x59: "Polygon Mewtwo",
  0x5a: "Polygon Dedede",
  0x5b: "Polygon Young Link",
  0x5c: "Polygon Goemon",
  0x5d: "Polygon Conker",
  0x5e: "Polygon Banjo",
  0x5f: "Polygon Peach",
  0x60: "Polygon Crash",
};

export const CHARACTER_NAMES_JA: Readonly<Record<number, string>> = {
  0x00: "マリオ",
  0x01: "フォックス",
  0x02: "ドンキーコング",
  0x03: "サムス",
  0x04: "ルイージ",
  0x05: "リンク",
  0x06: "ヨッシー",
  0x07: "キャプテン・ファルコン",
  0x08: "カービィ",
  0x09: "ピカチュウ",
  0x0a: "プリン",
  0x0b: "ネス",
  0x0c: "マスターハンド",
  0x0d: "メタルマリオ",
  0x0e: "謎のザコ敵 (マリオ)",
  0x0f: "謎のザコ敵 (フォックス)",
  0x10: "謎のザコ敵 (DK)",
  0x11: "謎のザコ敵 (サムス)",
  0x12: "謎のザコ敵 (ルイージ)",
  0x13: "謎のザコ敵 (リンク)",
  0x14: "謎のザコ敵 (ヨッシー)",
  0x15: "謎のザコ敵 (ファルコン)",
  0x16: "謎のザコ敵 (カービィ)",
  0x17: "謎のザコ敵 (ピカチュウ)",
  0x18: "謎のザコ敵 (プリン)",
  0x19: "謎のザコ敵 (ネス)",
  0x1a: "巨大ドンキーコング",
  0x1b: "おまかせ",
  0x1d: "ファルコ",
  0x1e: "ガノンドロフ",
  0x1f: "こどもリンク",
  0x20: "ドクターマリオ",
  0x21: "ワリオ",
  0x22: "ダークサムス",
  0x23: "リンク (EU)",
  0x24: "サムス (JP)",
  0x25: "ネス (JP)",
  0x26: "リュカ",
  0x27: "リンク (JP)",
  0x28: "ファルコン (JP)",
  0x29: "フォックス (JP)",
  0x2a: "マリオ (JP)",
  0x2b: "ルイージ (JP)",
  0x2c: "DK (JP)",
  0x2d: "ピカチュウ (EU)",
  0x2e: "プリン (JP)",
  0x2f: "プリン (EU)",
  0x30: "カービィ (JP)",
  0x31: "ヨッシー (JP)",
  0x32: "ピカチュウ (JP)",
  0x33: "サムス (EU)",
  0x34: "クッパ",
  0x35: "ギガクッパ",
  0x36: "マッドピアノ",
  0x37: "ウルフ",
  0x38: "コンカー",
  0x39: "ミュウツー",
  0x3a: "マルス",
  0x3b: "ソニック",
  0x3c: "サンドバッグ",
  0x3d: "スーパーソニック",
  0x3e: "シーク",
  0x3f: "マリナ",
  0x40: "デデデ大王",
  0x41: "ゴエモン",
  0x42: "ペッピー",
  0x43: "スリッピー",
  0x44: "バンジョー",
  0x45: "メタルルイージ",
  0x46: "エビス丸",
  0x47: "竜王",
  0x48: "クラッシュ",
  0x49: "ピーチ",
  0x4a: "ロイ",
  0x4b: "ドクタールイージ",
  0x4c: "ランキーコング",
  0x4d: "ポリゴンワリオ",
  0x4e: "ポリゴンリュカ",
  0x4f: "ポリゴンクッパ",
  0x50: "ポリゴンウルフ",
  0x51: "ポリゴンドクターマリオ",
  0x52: "ポリゴンソニック",
  0x53: "ポリゴンシーク",
  0x54: "ポリゴンマリナ",
  0x55: "ポリゴンファルコ",
  0x56: "ポリゴンガノンドロフ",
  0x57: "ポリゴンダークサムス",
  0x58: "ポリゴンマルス",
  0x59: "ポリゴンミュウツー",
  0x5a: "ポリゴンデデデ",
  0x5b: "ポリゴンこどもリンク",
  0x5c: "ポリゴンゴエモン",
  0x5d: "ポリゴンコンカー",
  0x5e: "ポリゴンバンジョー",
  0x5f: "ポリゴンピーチ",
  0x60: "ポリゴンクラッシュ",
};

export const StageId = {
  PeachsCastle: 0x00,
  SectorZ: 0x01,
  CongoJungle: 0x02,
  PlanetZebes: 0x03,
  HyruleCastle: 0x04,
  YoshisIsland: 0x05,
  DreamLand: 0x06,
  SaffronCity: 0x07,
  MushroomKingdom: 0x08,
  DreamLandBeta1: 0x09,
  DreamLandBeta2: 0x0a,
  HowToPlay: 0x0b,
  MiniYoshisIsland: 0x0c,
  MetaCrystal: 0x0d,
  DuelZone: 0x0e,
  RaceToTheFinish: 0x0f,
  FinalDestination: 0x10,
  Battlefield: 0x31,
  FountainOfDreams: 0x39,
} as const;

export type StageId = (typeof StageId)[keyof typeof StageId];

export const STAGE_NAMES: Readonly<Record<number, string>> = {
  0x00: "Peach's Castle",
  0x01: "Sector Z",
  0x02: "Congo Jungle",
  0x03: "Planet Zebes",
  0x04: "Hyrule Castle",
  0x05: "Yoshi's Island",
  0x06: "Dream Land",
  0x07: "Saffron City",
  0x08: "Mushroom Kingdom",
  0x09: "Dream Land Beta 1",
  0x0a: "Dream Land Beta 2",
  0x0b: "How to Play",
  0x0c: "Mini Yoshi's Island",
  0x0d: "Meta Crystal",
  0x0e: "Duel Zone",
  0x0f: "Race to the Finish",
  0x10: "Final Destination",
  0x31: "Battlefield",
  0x39: "Fountain of Dreams",
};

export const STAGE_NAMES_JA: Readonly<Record<number, string>> = {
  0x00: "ピーチ城上空",
  0x01: "セクターZ",
  0x02: "コンゴジャングル",
  0x03: "惑星ゼーベス",
  0x04: "ハイラル城",
  0x05: "ヨッシーアイランド",
  0x06: "プププランド",
  0x07: "ヤマブキシティ",
  0x08: "いにしえの王国",
  0x09: "プププランド ベータ1",
  0x0a: "プププランド ベータ2",
  0x0b: "あそびかた",
  0x0c: "ミニヨッシーアイランド",
  0x0d: "メタクリスタル",
  0x0e: "デュエルゾーン",
  0x0f: "ゴールをめざせ",
  0x10: "終点",
  0x31: "戦場",
  0x39: "夢の泉",
};

export const ActionStateId = {
  DeadD: 0x000,
  DeadS: 0x001,
  DeadU: 0x002,
  ScreenKO: 0x003,
  ScreenKOWait: 0x004,
  Entry: 0x005,
  Revive1: 0x007,
  Revive2: 0x008,
  ReviveWait: 0x009,
  Idle: 0x00a,
  Walk1: 0x00b,
  Walk2: 0x00c,
  Walk3: 0x00d,
  Dash: 0x00f,
  Run: 0x010,
  RunBrake: 0x011,
  Turn: 0x012,
  TurnRun: 0x013,
  JumpSquat: 0x014,
  ShieldJumpSquat: 0x015,
  JumpF: 0x016,
  JumpB: 0x017,
  JumpAerialF: 0x018,
  JumpAerialB: 0x019,
  Fall: 0x01a,
  FallAerial: 0x01b,
  Crouch: 0x01c,
  CrouchIdle: 0x01d,
  CrouchEnd: 0x01e,
  LandingLight: 0x01f,
  LandingHeavy: 0x020,
  Pass: 0x021,
  ShieldDrop: 0x022,
  Teeter: 0x023,
  TeeterStart: 0x024,
  DamageHigh1: 0x025,
  DamageHigh2: 0x026,
  DamageHigh3: 0x027,
  DamageMid1: 0x028,
  DamageMid2: 0x029,
  DamageMid3: 0x02a,
  DamageLow1: 0x02b,
  DamageLow2: 0x02c,
  DamageLow3: 0x02d,
  DamageAir1: 0x02e,
  DamageAir2: 0x02f,
  DamageAir3: 0x030,
  DamageElec1: 0x031,
  DamageElec2: 0x032,
  DamageFlyHigh: 0x033,
  DamageFlyMid: 0x034,
  DamageFlyLow: 0x035,
  DamageFlyTop: 0x036,
  DamageFlyRoll: 0x037,
  WallBounce: 0x038,
  Tumble: 0x039,
  FallSpecial: 0x03a,
  LandingSpecial: 0x03b,
  Tornado: 0x03c,
  Barrel: 0x03d,
  CeilingBonk: 0x042,
  DownBoundD: 0x043,
  DownWaitD: 0x044,
  DownStandD: 0x045,
  DownForwardD: 0x047,
  DownBackD: 0x048,
  TechF: 0x049,
  TechB: 0x04a,
  DownBoundU: 0x04a,
  DownForwardU: 0x04b,
  DownWaitU: 0x04c,
  DownStandU: 0x04d,
  DownBackU: 0x04e,
  DownAttackD: 0x04f,
  DownAttackU: 0x050,
  Tech: 0x051,
  Clang: 0x052,
  ClangRecoil: 0x053,
  CliffCatch: 0x054,
  CliffWait: 0x055,
  CliffQuick: 0x056,
  CliffClimbQuick2: 0x057,
  CliffClimbQuick3: 0x058,
  CliffSlow: 0x059,
  CliffClimbSlow2: 0x05a,
  CliffClimbSlow3: 0x05b,
  CliffAttackQuick: 0x05c,
  CliffAttackQuick2: 0x05d,
  CliffAttackSlow: 0x05e,
  CliffAttackSlow2: 0x05f,
  CliffEscapeQuick: 0x060,
  CliffEscapeQuick2: 0x061,
  CliffEscapeSlow: 0x062,
  CliffEscapeSlow2: 0x063,
  ShieldOn: 0x098,
  Shield: 0x099,
  ShieldOff: 0x09a,
  ShieldStun: 0x09b,
  RollF: 0x09c,
  RollB: 0x09d,
  ShieldBreakFly: 0x09e,
  ShieldBreakFall: 0x09f,
  ShieldBreakDownBound: 0x0a0,
  ShieldBreakStand: 0x0a1,
  FuraFura: 0x0a2,
  Stun: 0x0a4,
  Sleep: 0x0a5,
  Grab: 0x0a6,
  GrabPull: 0x0a7,
  GrabWait: 0x0a8,
  ThrowF: 0x0a9,
  ThrowB: 0x0aa,
  CapturePulled: 0x0ab,
  CaptureWait: 0x0ac,
  Taunt: 0x0bd,
  Jab1: 0x0be,
  Jab2: 0x0bf,
  DashAttack: 0x0c0,
  FTilt1: 0x0c1,
  FTilt2: 0x0c2,
  FTilt3: 0x0c3,
  FTilt4: 0x0c4,
  FTilt5: 0x0c5,
  UTilt: 0x0c7,
  DTilt: 0x0c9,
  FSmash1: 0x0ca,
  FSmash2: 0x0cb,
  FSmash3: 0x0cc,
  FSmash4: 0x0cd,
  FSmash5: 0x0ce,
  USmash: 0x0cf,
  DSmash: 0x0d0,
  Nair: 0x0d1,
  Fair: 0x0d2,
  Bair: 0x0d3,
  Uair: 0x0d4,
  Dair: 0x0d5,
  LandingAirX: 0x0db,
} as const;

export type ActionStateId = (typeof ActionStateId)[keyof typeof ActionStateId];

export const ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x000: "DeadD",
  0x001: "DeadS",
  0x002: "DeadU",
  0x003: "ScreenKO",
  0x004: "ScreenKOWait",
  0x005: "Entry",
  0x007: "Revive1",
  0x008: "Revive2",
  0x009: "ReviveWait",
  0x00a: "Idle",
  0x00b: "Walk1",
  0x00c: "Walk2",
  0x00d: "Walk3",
  0x00f: "Dash",
  0x010: "Run",
  0x011: "RunBrake",
  0x012: "Turn",
  0x013: "TurnRun",
  0x014: "JumpSquat",
  0x015: "ShieldJumpSquat",
  0x016: "JumpF",
  0x017: "JumpB",
  0x018: "JumpAerialF",
  0x019: "JumpAerialB",
  0x01a: "Fall",
  0x01b: "FallAerial",
  0x01c: "Crouch",
  0x01d: "CrouchIdle",
  0x01e: "CrouchEnd",
  0x01f: "LandingLight",
  0x020: "LandingHeavy",
  0x021: "Pass",
  0x022: "ShieldDrop",
  0x023: "Teeter",
  0x024: "TeeterStart",
  0x025: "DamageHigh1",
  0x026: "DamageHigh2",
  0x027: "DamageHigh3",
  0x028: "DamageMid1",
  0x029: "DamageMid2",
  0x02a: "DamageMid3",
  0x02b: "DamageLow1",
  0x02c: "DamageLow2",
  0x02d: "DamageLow3",
  0x02e: "DamageAir1",
  0x02f: "DamageAir2",
  0x030: "DamageAir3",
  0x031: "DamageElec1",
  0x032: "DamageElec2",
  0x033: "DamageFlyHigh",
  0x034: "DamageFlyMid",
  0x035: "DamageFlyLow",
  0x036: "DamageFlyTop",
  0x037: "DamageFlyRoll",
  0x038: "WallBounce",
  0x039: "Tumble",
  0x03a: "FallSpecial",
  0x03b: "LandingSpecial",
  0x03c: "Tornado",
  0x03d: "Barrel",
  0x042: "CeilingBonk",
  0x043: "DownBoundD",
  0x044: "DownWaitD (Missed Tech)",
  0x045: "DownStandD",
  0x047: "DownForwardD",
  0x048: "DownBackD",
  0x049: "TechF",
  0x04a: "TechB",
  0x04b: "DownForwardU",
  0x04c: "DownWaitU (Missed Tech)",
  0x04d: "DownStandU",
  0x04e: "DownBackU",
  0x04f: "DownAttackD",
  0x050: "DownAttackU",
  0x051: "Tech",
  0x052: "Clang",
  0x053: "ClangRecoil",
  0x054: "CliffCatch",
  0x055: "CliffWait",
  0x056: "CliffQuick",
  0x057: "CliffClimbQuick2",
  0x058: "CliffClimbQuick3",
  0x059: "CliffSlow",
  0x05a: "CliffClimbSlow2",
  0x05b: "CliffClimbSlow3",
  0x05c: "CliffAttackQuick",
  0x05d: "CliffAttackQuick2",
  0x05e: "CliffAttackSlow",
  0x05f: "CliffAttackSlow2",
  0x060: "CliffEscapeQuick",
  0x061: "CliffEscapeQuick2",
  0x062: "CliffEscapeSlow",
  0x063: "CliffEscapeSlow2",
  0x098: "ShieldOn",
  0x099: "Shield",
  0x09a: "ShieldOff",
  0x09b: "ShieldStun",
  0x09c: "RollF",
  0x09d: "RollB",
  0x09e: "ShieldBreakFly",
  0x09f: "ShieldBreakFall",
  0x0a0: "ShieldBreakDownBound",
  0x0a1: "ShieldBreakStand",
  0x0a2: "FuraFura",
  0x0a4: "Stun",
  0x0a5: "Sleep",
  0x0a6: "Grab",
  0x0a7: "GrabPull",
  0x0a8: "GrabWait",
  0x0a9: "ThrowF",
  0x0aa: "ThrowB",
  0x0ab: "CapturePulled",
  0x0ac: "CaptureWait",
  0x0bd: "Taunt",
  0x0be: "Jab1",
  0x0bf: "Jab2",
  0x0c0: "DashAttack",
  0x0c7: "UTilt",
  0x0c9: "DTilt",
  0x0cf: "USmash",
  0x0d0: "DSmash",
  0x0d1: "Nair",
  0x0d2: "Fair",
  0x0d3: "Bair",
  0x0d4: "Uair",
  0x0d5: "Dair",
  0x0db: "LandingAirX",
};

export const ACTION_STATE_NAMES_JA: Readonly<Record<number, string>> = {
  0x000: "撃墜 (下)",
  0x001: "撃墜 (横)",
  0x002: "撃墜 (上)",
  0x003: "画面撃墜",
  0x004: "画面撃墜待機",
  0x005: "登場",
  0x007: "復活1",
  0x008: "復活2",
  0x009: "復活台待機",
  0x00a: "待機",
  0x00b: "歩き1",
  0x00c: "歩き2",
  0x00d: "歩き3",
  0x00f: "ダッシュ",
  0x010: "走行",
  0x011: "ブレーキ",
  0x012: "反転",
  0x013: "ターン",
  0x014: "踏切",
  0x015: "シールド踏切",
  0x016: "前ジャンプ",
  0x017: "後ジャンプ",
  0x018: "空中前ジャンプ",
  0x019: "空中後ジャンプ",
  0x01a: "落下",
  0x01b: "空中落下",
  0x01c: "しゃがみ",
  0x01d: "しゃがみ待機",
  0x01e: "しゃがみ解除",
  0x01f: "着地",
  0x020: "着地 (硬直)",
  0x021: "すり抜け",
  0x022: "シールド解除",
  0x023: "崖立ち",
  0x024: "崖立ち開始",
  0x025: "被弾 (強1)",
  0x026: "被弾 (強2)",
  0x027: "被弾 (強3)",
  0x028: "被弾 (中1)",
  0x029: "被弾 (中2)",
  0x02a: "被弾 (中3)",
  0x02b: "被弾 (弱1)",
  0x02c: "被弾 (弱2)",
  0x02d: "被弾 (弱3)",
  0x02e: "空中被弾1",
  0x02f: "空中被弾2",
  0x030: "空中被弾3",
  0x031: "電撃被弾1",
  0x032: "電撃被弾2",
  0x033: "ふっとび (強)",
  0x034: "ふっとび (中)",
  0x035: "ふっとび (弱)",
  0x036: "ふっとび (上)",
  0x037: "きりもみふっとび",
  0x038: "壁バウンド",
  0x039: "倒れ",
  0x03a: "しりもち落下",
  0x03b: "着地硬直",
  0x03c: "竜巻",
  0x03d: "タル大砲",
  0x042: "天井激突",
  0x043: "ダウンバウンド (うつ伏せ)",
  0x044: "倒れ待機 (うつ伏せ / 受け身失敗)",
  0x045: "起き上がり (うつ伏せ)",
  0x047: "起き上がり前転 (うつ伏せ)",
  0x048: "起き上がり後転 (うつ伏せ)",
  0x049: "前受け身",
  0x04a: "後受け身",
  0x04b: "起き上がり前転 (仰向け)",
  0x04c: "倒れ待機 (仰向け / 受け身失敗)",
  0x04d: "起き上がり (仰向け)",
  0x04e: "起き上がり後転 (仰向け)",
  0x04f: "起き上がり攻撃 (うつ伏せ)",
  0x050: "起き上がり攻撃 (仰向け)",
  0x051: "受け身",
  0x052: "相殺",
  0x053: "相殺反動",
  0x054: "崖つかまり",
  0x055: "崖待機",
  0x056: "崖登り (早)",
  0x057: "崖登り動作2 (早)",
  0x058: "崖登り動作3 (早)",
  0x059: "崖登り (遅)",
  0x05a: "崖登り動作2 (遅)",
  0x05b: "崖登り動作3 (遅)",
  0x05c: "崖攻撃 (早)",
  0x05d: "崖攻撃動作2 (早)",
  0x05e: "崖攻撃 (遅)",
  0x05f: "崖攻撃動作2 (遅)",
  0x060: "崖回避 (早)",
  0x061: "崖回避動作2 (早)",
  0x062: "崖回避 (遅)",
  0x063: "崖回避動作2 (遅)",
  0x098: "ガード開始",
  0x099: "ガード",
  0x09a: "ガード解除",
  0x09b: "ガード硬直",
  0x09c: "前緊急回避",
  0x09d: "後緊急回避",
  0x09e: "ガード割れふっとび",
  0x09f: "ガード割れ落下",
  0x0a0: "ガード割れダウン",
  0x0a1: "ガード割れ起き上がり",
  0x0a2: "ふらふら",
  0x0a4: "気絶",
  0x0a5: "眠り",
  0x0a6: "つかみ",
  0x0a7: "つかみ引き",
  0x0a8: "つかみ維持",
  0x0a9: "前投げ",
  0x0aa: "後投げ",
  0x0ab: "被つかみ",
  0x0ac: "つかまれ待機",
  0x0bd: "アピール",
  0x0be: "弱1",
  0x0bf: "弱2",
  0x0c0: "ダッシュ攻撃",
  0x0c7: "上強",
  0x0c9: "下強",
  0x0cf: "上スマ",
  0x0d0: "下スマ",
  0x0d1: "空N",
  0x0d2: "空前",
  0x0d3: "空後",
  0x0d4: "空上",
  0x0d5: "空下",
  0x0db: "着地隙",
};

// ---------------------------------------------------------------------------
// Character-specific action states (docs/RMGR_SPEC.md section 8.3.1) -
// ActionStateId >= 0x0DC. There is no cross-character ID sharing at the
// engine level: every character's status enum independently restarts at
// 0x0DC in its own source file, so the same numeric value means something
// different (or nothing) per character. The one exception is Luigi, whose
// table is byte-for-byte identical to Mario's and points at the literal
// same functions - confirmed against the decompilation, not just
// coincidentally same-numbered - so the two share MARIO_LUIGI_ACTION_STATE_NAMES
// below. Every other table here is independently verified.
//
// A few states below aren't actually special moves despite sharing this
// numeric block - Attack13 (Mario/Luigi/Falcon/Link/Ness) and
// Attack100Start/Loop/End (Fox/Kirby/Jigglypuff) are jab-combo
// continuation states from the original engine's per-character table
// layout. Flagged inline rather than assumed.
//
// Scoped to the original 12 characters only (see getCharacterFamily()) -
// not extended to any Remix-added unique character that merely looks like
// a reskin (Dr. Mario, Dr. Luigi, Dark Samus, Giant DK, etc.), since those
// aren't confirmed to share an original character's code.
//
// English only - like ItemUpdate's kind (getItemKindName()), these come
// straight from the decompilation's own symbol names, and no Japanese
// translation is documented for them.

const MARIO_LUIGI_ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x0dc: "Attack13", // jab-combo continuation, not a special
  0x0dd: "AppearR",
  0x0de: "AppearL",
  0x0df: "SpecialN",
  0x0e0: "SpecialAirN",
  0x0e1: "SpecialHi",
  0x0e2: "SpecialAirHi",
  0x0e3: "SpecialLw",
  0x0e4: "SpecialAirLw",
};

const FOX_ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x0dc: "Attack100Start", // jab-combo continuation, not a special
  0x0dd: "Attack100Loop", // jab-combo continuation, not a special
  0x0de: "Attack100End", // jab-combo continuation, not a special
  0x0df: "AppearR",
  0x0e0: "AppearL",
  0x0e1: "SpecialN",
  0x0e2: "SpecialAirN",
  0x0e3: "SpecialHiStart",
  0x0e4: "SpecialAirHiStart",
  0x0e5: "SpecialHiHold",
  0x0e6: "SpecialAirHiHold",
  0x0e7: "SpecialHi",
  0x0e8: "SpecialAirHi",
  0x0e9: "SpecialHiEnd",
  0x0ea: "SpecialAirHiEnd",
  0x0eb: "SpecialAirHiBound",
  0x0ec: "SpecialLwStart",
  0x0ed: "SpecialLwHit",
  0x0ee: "SpecialLwEnd",
  0x0ef: "SpecialLwLoop",
  0x0f0: "SpecialLwTurn",
  0x0f1: "SpecialAirLwStart",
  0x0f2: "SpecialAirLwHit",
  0x0f3: "SpecialAirLwEnd",
  0x0f4: "SpecialAirLwLoop",
  0x0f5: "SpecialAirLwTurn",
};

const DONKEY_KONG_ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x0dc: "AppearR",
  0x0dd: "AppearL",
  0x0de: "SpecialNStart",
  0x0df: "SpecialAirNStart",
  0x0e0: "SpecialNLoop",
  0x0e1: "SpecialAirNLoop",
  0x0e2: "SpecialNEnd",
  0x0e3: "SpecialAirNEnd",
  0x0e4: "SpecialNFull",
  0x0e5: "SpecialAirNFull",
  0x0e6: "SpecialHi",
  0x0e7: "SpecialAirHi",
  0x0e8: "SpecialLwStart",
  0x0e9: "SpecialLwLoop",
  0x0ea: "SpecialLwEnd",
  0x0eb: "ThrowFWait",
  0x0ec: "ThrowFWalkSlow",
  0x0ed: "ThrowFWalkMiddle",
  0x0ee: "ThrowFWalkFast",
  0x0ef: "ThrowFTurn",
  0x0f0: "ThrowFKneeBend",
  0x0f1: "ThrowFFall",
  0x0f2: "ThrowFLanding",
  0x0f3: "ThrowFDamage", // aka ThrowFEnd
  0x0f4: "ThrowFF",
  0x0f5: "ThrowAirFF",
  0x0f6: "HeavyThrowF",
  0x0f7: "HeavyThrowB",
  0x0f8: "HeavyThrowF4",
  0x0f9: "HeavyThrowB4",
};

const SAMUS_ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x0dc: "AppearR",
  0x0dd: "AppearL",
  0x0de: "SpecialNStart",
  0x0df: "SpecialNLoop",
  0x0e0: "SpecialNEnd",
  0x0e1: "SpecialAirNStart",
  0x0e2: "SpecialAirNEnd",
  0x0e3: "SpecialHi",
  0x0e4: "SpecialAirHi",
  0x0e5: "SpecialLw",
  0x0e6: "SpecialAirLw",
};

const LINK_ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x0dc: "Attack13", // jab-combo continuation, not a special
  0x0dd: "Attack100Start",
  0x0de: "Attack100Loop",
  0x0df: "Attack100End",
  0x0e0: "AppearR",
  0x0e1: "AppearL",
  0x0e2: "SpecialHi",
  0x0e3: "SpecialHiEnd",
  0x0e4: "SpecialAirHi",
  0x0e5: "SpecialN",
  0x0e6: "SpecialNGet",
  0x0e7: "SpecialNEmpty",
  0x0e8: "SpecialAirN",
  0x0e9: "SpecialAirNReturn",
  0x0ea: "SpecialAirNEmpty",
  0x0eb: "SpecialLw",
  0x0ec: "SpecialAirLw",
};

// SpecialHi/SpecialAirHi here are the plain double-jump slot - Yoshi has
// no real up-B.
const YOSHI_ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x0dc: "AppearR",
  0x0dd: "AppearL",
  0x0de: "SpecialHi",
  0x0df: "SpecialAirHi",
  0x0e0: "SpecialLwStart",
  0x0e1: "SpecialLwLanding",
  0x0e2: "SpecialAirLwStart",
  0x0e3: "SpecialAirLwLoop",
  0x0e4: "SpecialN",
  0x0e5: "SpecialNCatch",
  0x0e6: "SpecialNRelease",
  0x0e7: "SpecialAirN",
  0x0e8: "SpecialAirNCatch",
  0x0e9: "SpecialAirNRelease",
};

const CAPTAIN_FALCON_ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x0dc: "Attack13", // jab-combo continuation, not a special
  0x0dd: "Attack100Start",
  0x0de: "Attack100Loop",
  0x0df: "Attack100End",
  0x0e0: "AppearRStart",
  0x0e1: "AppearLStart",
  0x0e2: "AppearREnd",
  0x0e3: "AppearLEnd",
  0x0e4: "SpecialN",
  0x0e5: "SpecialAirN",
  0x0e6: "SpecialLw",
  0x0e7: "SpecialLwAir",
  0x0e8: "SpecialLwLanding",
  0x0e9: "SpecialAirLw",
  0x0ea: "SpecialLwBound",
  0x0eb: "SpecialHi",
  0x0ec: "SpecialHiCatch",
  0x0ed: "SpecialHiThrow",
  0x0ee: "SpecialAirHi",
};

const PIKACHU_ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x0dc: "AppearR",
  0x0dd: "AppearL",
  0x0de: "SpecialN",
  0x0df: "SpecialAirN",
  0x0e0: "SpecialLwStart",
  0x0e1: "SpecialLwLoop",
  0x0e2: "SpecialLwHit",
  0x0e3: "SpecialLwEnd",
  0x0e4: "SpecialAirLwStart",
  0x0e5: "SpecialAirLwLoop",
  0x0e6: "SpecialAirLwHit",
  0x0e7: "SpecialAirLwEnd",
  0x0e8: "SpecialHiStart",
  0x0e9: "SpecialHi",
  0x0ea: "SpecialHiEnd",
  0x0eb: "SpecialAirHiStart",
  0x0ec: "SpecialAirHi",
  0x0ed: "SpecialAirHiEnd",
};

const JIGGLYPUFF_ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x0dc: "Attack100Start", // unused, per the decomp's own comment
  0x0dd: "Attack100Loop", // unused
  0x0de: "Attack100End", // unused
  0x0df: "JumpAerialF1",
  0x0e0: "JumpAerialF2",
  0x0e1: "JumpAerialF3",
  0x0e2: "JumpAerialF4",
  0x0e3: "JumpAerialF5",
  0x0e4: "AppearR",
  0x0e5: "AppearL",
  0x0e6: "SpecialN",
  0x0e7: "SpecialAirN",
  0x0e8: "SpecialHi",
  0x0e9: "SpecialAirHi",
  0x0ea: "SpecialLw",
  0x0eb: "SpecialAirLw",
};

const NESS_ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x0dc: "Attack13", // jab-combo continuation, not a special
  0x0dd: "AppearRStart",
  0x0de: "AppearLStart",
  0x0df: "AppearWait",
  0x0e0: "AppearREnd",
  0x0e1: "AppearLEnd",
  0x0e2: "SpecialN",
  0x0e3: "SpecialAirN",
  0x0e4: "SpecialHiStart",
  0x0e5: "SpecialHiHold",
  0x0e6: "SpecialHiEnd",
  0x0e7: "SpecialHiJibaku",
  0x0e8: "SpecialAirHiStart",
  0x0e9: "SpecialAirHiHold",
  0x0ea: "SpecialAirHiEnd",
  0x0eb: "SpecialAirHiBound",
  0x0ec: "SpecialAirHiJibaku",
  0x0ed: "SpecialLwStart",
  0x0ee: "SpecialLwHold",
  0x0ef: "SpecialLwHit",
  0x0f0: "SpecialLwEnd",
  0x0f1: "SpecialAirLwStart",
  0x0f2: "SpecialAirLwHold",
  0x0f3: "SpecialAirLwHit",
  0x0f4: "SpecialAirLwEnd",
};

// By far the largest, since it includes a full duplicate move-set slot for
// every character whose neutral-B Kirby can copy. "Purin" is Jigglypuff's
// Japanese name, used verbatim in the decompilation's own symbol names.
// There is no CopyKirbySpecialN and no Copy-DK-SpecialHi/Lw slots, since
// only neutral-B is copyable - matches the decompilation's own naming
// exactly, nothing inferred.
const KIRBY_ACTION_STATE_NAMES: Readonly<Record<number, string>> = {
  0x0dc: "Attack100Start", // jab-combo continuation, not a special
  0x0dd: "Attack100Loop", // jab-combo continuation, not a special
  0x0de: "Attack100End", // jab-combo continuation, not a special
  0x0df: "JumpAerialF1",
  0x0e0: "JumpAerialF2",
  0x0e1: "JumpAerialF3",
  0x0e2: "JumpAerialF4",
  0x0e3: "JumpAerialF5",
  0x0e4: "ThrowF",
  0x0e5: "ThrowFFall",
  0x0e6: "ThrowFLanding",
  0x0e7: "CopyMarioSpecialN",
  0x0e8: "CopyMarioSpecialAirN",
  0x0e9: "CopyLuigiSpecialN",
  0x0ea: "CopyLuigiSpecialAirN",
  0x0eb: "CopyFoxSpecialN",
  0x0ec: "CopyFoxSpecialAirN",
  0x0ed: "CopySamusSpecialNStart",
  0x0ee: "CopySamusSpecialNLoop",
  0x0ef: "CopySamusSpecialNEnd",
  0x0f0: "CopySamusSpecialAirNStart",
  0x0f1: "CopySamusSpecialAirNEnd",
  0x0f2: "CopyDonkeySpecialNStart",
  0x0f3: "CopyDonkeySpecialAirNStart",
  0x0f4: "CopyDonkeySpecialNLoop",
  0x0f5: "CopyDonkeySpecialAirNLoop",
  0x0f6: "CopyDonkeySpecialNEnd",
  0x0f7: "CopyDonkeySpecialAirNEnd",
  0x0f8: "CopyDonkeySpecialNFull",
  0x0f9: "CopyDonkeySpecialAirNFull",
  0x0fa: "AppearR",
  0x0fb: "AppearL",
  0x0fc: "CopyPikachuSpecialN",
  0x0fd: "CopyPikachuSpecialAirN",
  0x0fe: "CopyNessSpecialN",
  0x0ff: "CopyNessSpecialAirN",
  0x100: "SpecialHi",
  0x101: "SpecialHiLanding",
  0x102: "SpecialAirHi",
  0x103: "SpecialAirHiFall",
  0x104: "SpecialLwStart",
  0x105: "SpecialLwUnk",
  0x106: "SpecialLwHold",
  0x107: "SpecialLwEnd",
  0x108: "SpecialAirLwStart",
  0x109: "SpecialAirLwHold",
  0x10a: "SpecialAirLwLanding",
  0x10b: "SpecialAirLwFall",
  0x10c: "SpecialAirLwEnd",
  0x10d: "SpecialNStart",
  0x10e: "SpecialNLoop",
  0x10f: "SpecialNEnd",
  0x110: "SpecialNCatch",
  0x111: "SpecialNEat",
  0x112: "SpecialNThrow",
  0x113: "SpecialNWait",
  0x114: "SpecialNTurn",
  0x115: "SpecialNCopy",
  0x116: "SpecialAirNStart",
  0x117: "SpecialAirNLoop",
  0x118: "SpecialAirNEnd",
  0x119: "SpecialAirNCatch",
  0x11a: "SpecialAirNEat",
  0x11b: "SpecialAirNThrow",
  0x11c: "SpecialAirNWait",
  0x11d: "SpecialAirNTurn",
  0x11e: "SpecialAirNCopy",
  0x11f: "CopyLinkSpecialN",
  0x120: "CopyLinkSpecialNGet",
  0x121: "CopyLinkSpecialNEmpty",
  0x122: "CopyLinkSpecialAirN",
  0x123: "CopyLinkSpecialAirNReturn",
  0x124: "CopyLinkSpecialAirNEmpty",
  0x125: "CopyPurinSpecialN",
  0x126: "CopyPurinSpecialAirN",
  0x127: "CopyCaptainSpecialN",
  0x128: "CopyCaptainSpecialAirN",
  0x129: "CopyYoshiSpecialN",
  0x12a: "CopyYoshiSpecialNCatch",
  0x12b: "CopyYoshiSpecialNRelease",
  0x12c: "CopyYoshiSpecialAirN",
  0x12d: "CopyYoshiSpecialAirNCatch",
  0x12e: "CopyYoshiSpecialAirNRelease",
};

/** The original 12 characters' movesets - see getCharacterFamily(). */
export type CharacterFamily =
  | "mario" // shared with Luigi - see MARIO_LUIGI_ACTION_STATE_NAMES
  | "luigi"
  | "fox"
  | "donkeyKong"
  | "samus"
  | "link"
  | "yoshi"
  | "captainFalcon"
  | "kirby"
  | "pikachu"
  | "jigglypuff"
  | "ness";

const CHARACTER_ACTION_STATE_NAMES: Readonly<
  Record<CharacterFamily, Readonly<Record<number, string>>>
> = {
  mario: MARIO_LUIGI_ACTION_STATE_NAMES,
  luigi: MARIO_LUIGI_ACTION_STATE_NAMES,
  fox: FOX_ACTION_STATE_NAMES,
  donkeyKong: DONKEY_KONG_ACTION_STATE_NAMES,
  samus: SAMUS_ACTION_STATE_NAMES,
  link: LINK_ACTION_STATE_NAMES,
  yoshi: YOSHI_ACTION_STATE_NAMES,
  captainFalcon: CAPTAIN_FALCON_ACTION_STATE_NAMES,
  kirby: KIRBY_ACTION_STATE_NAMES,
  pikachu: PIKACHU_ACTION_STATE_NAMES,
  jigglypuff: JIGGLYPUFF_ACTION_STATE_NAMES,
  ness: NESS_ACTION_STATE_NAMES,
};

export interface LookupOptions {
  readonly goodName?: string | undefined;
  readonly lang?: Language | undefined;
  /**
   * Which character's moveset to resolve a character-specific action state
   * (`>= 0x0DC`) against - see `CharacterFamily`/`getCharacterFamily()`.
   * Ignored for `id < 0x0DC` (the shared table). Omit (or pass an ID that
   * doesn't map to one of the original 12) to get the generic
   * `Special 0x...` placeholder for that range, same as before this option
   * existed.
   */
  readonly characterId?: number | undefined;
}

export interface GameDefinitions {
  readonly goodName: string;
  readonly characterNames: {
    readonly en: Readonly<Record<number, string>>;
    readonly ja: Readonly<Record<number, string>>;
  };
  readonly stageNames: {
    readonly en: Readonly<Record<number, string>>;
    readonly ja: Readonly<Record<number, string>>;
  };
  readonly actionStateNames: {
    readonly en: Readonly<Record<number, string>>;
    readonly ja: Readonly<Record<number, string>>;
  };
  getCharacterName(id: number, lang?: Language): string;
  getStageName(id: number, lang?: Language): string;
  // characterId resolves a character-specific action state (>= 0x0DC) -
  // see LookupOptions.characterId's doc comment.
  getActionStateName(id: number, lang?: Language, characterId?: number): string;
  isJigglypuffCharacter(id: number): boolean;
  isNessCharacter(id: number): boolean;
  isYoshiCharacter(id: number): boolean;
  isFoxCharacter(id: number): boolean;
  isMarioCharacter(id: number): boolean;
  isLuigiCharacter(id: number): boolean;
  isDonkeyKongCharacter(id: number): boolean;
  isSamusCharacter(id: number): boolean;
  isLinkCharacter(id: number): boolean;
  isCaptainFalconCharacter(id: number): boolean;
  isKirbyCharacter(id: number): boolean;
  isPikachuCharacter(id: number): boolean;
  isShieldState(id: number): boolean;
  isShieldStunState(id: number): boolean;
  isShieldBreakState(id: number): boolean;
  isGrabState(id: number): boolean;
  isLedgeState(id: number): boolean;
  isNAOriginal12(id: number): boolean;
  isJPOriginal12(id: number): boolean;
  getCharacterGroup(id: number): CharacterGroup;
}

const FTILT_RANGE: [number, number] = [0x0c1, 0x0c5];
const FSMASH_RANGE: [number, number] = [0x0ca, 0x0ce];

/**
 * Maps any character ID to one of the original 12 movesets, or `null` if
 * `id` isn't confidently one of them - see `CharacterFamily`'s own doc
 * comment for exactly what "confidently" excludes (Remix-added unique
 * characters that merely look like a reskin, e.g. Dr. Mario/Dr. Luigi/Dark
 * Samus/Giant DK). Polygon/JP/EU-region variants of an original 12
 * character map to that character's family, following the same
 * already-established convention as `isMarioCharacter()` etc.
 */
function getCharacterFamily(id: number): CharacterFamily | null {
  if (isMarioCharacterId(id)) return "mario";
  if (isLuigiCharacterId(id)) return "luigi";
  if (isFoxCharacterId(id)) return "fox";
  if (isDonkeyKongCharacterId(id)) return "donkeyKong";
  if (isSamusCharacterId(id)) return "samus";
  if (isLinkCharacterId(id)) return "link";
  if (isYoshiCharacterId(id)) return "yoshi";
  if (isCaptainFalconCharacterId(id)) return "captainFalcon";
  if (isKirbyCharacterId(id)) return "kirby";
  if (isPikachuCharacterId(id)) return "pikachu";
  if (isJigglypuffCharacterId(id)) return "jigglypuff";
  if (isNessCharacterId(id)) return "ness";
  return null;
}

function isMarioCharacterId(id: number): boolean {
  return (
    id === CharacterId.Mario ||
    id === CharacterId.PolygonMario ||
    id === CharacterId.MarioJP
  );
}
function isLuigiCharacterId(id: number): boolean {
  return (
    id === CharacterId.Luigi ||
    id === CharacterId.PolygonLuigi ||
    id === CharacterId.LuigiJP
  );
}
function isFoxCharacterId(id: number): boolean {
  return (
    id === CharacterId.Fox ||
    id === CharacterId.PolygonFox ||
    id === CharacterId.FoxJP
  );
}
function isDonkeyKongCharacterId(id: number): boolean {
  return (
    id === CharacterId.DonkeyKong ||
    id === CharacterId.PolygonDK ||
    id === CharacterId.DKJP
  );
}
function isSamusCharacterId(id: number): boolean {
  return (
    id === CharacterId.Samus ||
    id === CharacterId.PolygonSamus ||
    id === CharacterId.SamusJP ||
    id === CharacterId.SamusEU
  );
}
function isLinkCharacterId(id: number): boolean {
  return (
    id === CharacterId.Link ||
    id === CharacterId.PolygonLink ||
    id === CharacterId.LinkJP ||
    id === CharacterId.LinkEU
  );
}
function isYoshiCharacterId(id: number): boolean {
  return (
    id === CharacterId.Yoshi ||
    id === CharacterId.PolygonYoshi ||
    id === CharacterId.YoshiJP
  );
}
function isCaptainFalconCharacterId(id: number): boolean {
  return (
    id === CharacterId.CaptainFalcon ||
    id === CharacterId.PolygonFalcon ||
    id === CharacterId.FalconJP
  );
}
function isKirbyCharacterId(id: number): boolean {
  return (
    id === CharacterId.Kirby ||
    id === CharacterId.PolygonKirby ||
    id === CharacterId.KirbyJP
  );
}
function isPikachuCharacterId(id: number): boolean {
  return (
    id === CharacterId.Pikachu ||
    id === CharacterId.PolygonPikachu ||
    id === CharacterId.PikachuJP ||
    id === CharacterId.PikachuEU
  );
}
function isJigglypuffCharacterId(id: number): boolean {
  return (
    id === CharacterId.Jigglypuff ||
    id === CharacterId.PolygonJigglypuff ||
    id === CharacterId.JigglypuffJP ||
    id === CharacterId.JigglypuffEU
  );
}
function isNessCharacterId(id: number): boolean {
  return (
    id === CharacterId.Ness ||
    id === CharacterId.PolygonNess ||
    id === CharacterId.NessJP
  );
}

function resolveLangAndGoodName(langOrOptions?: Language | LookupOptions): {
  lang: Language;
  goodName?: string | undefined;
  characterId?: number | undefined;
} {
  if (!langOrOptions) return { lang: "en" };
  if (typeof langOrOptions === "string") return { lang: langOrOptions };
  return {
    lang: langOrOptions.lang ?? "en",
    goodName: langOrOptions.goodName,
    characterId: langOrOptions.characterId,
  };
}

class StandardGameDefinitions implements GameDefinitions {
  readonly goodName: string;
  readonly characterNames = {
    en: CHARACTER_NAMES,
    ja: CHARACTER_NAMES_JA,
  };
  readonly stageNames = {
    en: STAGE_NAMES,
    ja: STAGE_NAMES_JA,
  };
  readonly actionStateNames = {
    en: ACTION_STATE_NAMES,
    ja: ACTION_STATE_NAMES_JA,
  };

  constructor(goodName: string = GoodName.SmashRemix2_0_1) {
    this.goodName = goodName;
  }

  getCharacterName(id: number, lang: Language = "en"): string {
    const table =
      lang === "ja" ? this.characterNames.ja : this.characterNames.en;
    return (
      table[id] ??
      (lang === "ja"
        ? `キャラクター 0x${id.toString(16)}`
        : `Character 0x${id.toString(16)}`)
    );
  }

  getStageName(id: number, lang: Language = "en"): string {
    const table = lang === "ja" ? this.stageNames.ja : this.stageNames.en;
    return (
      table[id] ??
      (lang === "ja"
        ? `ステージ 0x${id.toString(16)}`
        : `Stage 0x${id.toString(16)}`)
    );
  }

  getActionStateName(
    id: number,
    lang: Language = "en",
    characterId?: number,
  ): string {
    // Character-specific range (docs/RMGR_SPEC.md section 8.3.1) - only
    // resolved when a characterId maps to one of the original 12; anyone
    // else (including no characterId at all) falls through to the generic
    // placeholder below, same as before this parameter existed. English
    // only - see CHARACTER_ACTION_STATE_NAMES's own doc comment for why.
    if (id >= 0x0dc && characterId !== undefined) {
      const family = getCharacterFamily(characterId);
      if (family) {
        const known = CHARACTER_ACTION_STATE_NAMES[family][id];
        if (known) return known;
      }
    }

    const table =
      lang === "ja" ? this.actionStateNames.ja : this.actionStateNames.en;
    const known = table[id];
    if (known) return known;
    if (id >= FTILT_RANGE[0] && id <= FTILT_RANGE[1]) {
      return lang === "ja" ? "横強" : "FTilt";
    }
    if (id >= FSMASH_RANGE[0] && id <= FSMASH_RANGE[1]) {
      return lang === "ja" ? "横スマ" : "FSmash";
    }
    if (id >= 0x0dc) {
      return lang === "ja"
        ? `必殺技 0x${id.toString(16)}`
        : `Special 0x${id.toString(16)}`;
    }
    return lang === "ja"
      ? `状態 0x${id.toString(16)}`
      : `State 0x${id.toString(16)}`;
  }

  isJigglypuffCharacter(id: number): boolean {
    return isJigglypuffCharacterId(id);
  }

  isNessCharacter(id: number): boolean {
    return isNessCharacterId(id);
  }

  isYoshiCharacter(id: number): boolean {
    return isYoshiCharacterId(id);
  }

  isFoxCharacter(id: number): boolean {
    return isFoxCharacterId(id);
  }

  isMarioCharacter(id: number): boolean {
    return isMarioCharacterId(id);
  }

  isLuigiCharacter(id: number): boolean {
    return isLuigiCharacterId(id);
  }

  isDonkeyKongCharacter(id: number): boolean {
    return isDonkeyKongCharacterId(id);
  }

  isSamusCharacter(id: number): boolean {
    return isSamusCharacterId(id);
  }

  isLinkCharacter(id: number): boolean {
    return isLinkCharacterId(id);
  }

  isCaptainFalconCharacter(id: number): boolean {
    return isCaptainFalconCharacterId(id);
  }

  isKirbyCharacter(id: number): boolean {
    return isKirbyCharacterId(id);
  }

  isPikachuCharacter(id: number): boolean {
    return isPikachuCharacterId(id);
  }

  isShieldState(id: number): boolean {
    return (
      id === ActionStateId.ShieldOn ||
      id === ActionStateId.Shield ||
      id === ActionStateId.ShieldOff ||
      id === ActionStateId.ShieldStun
    );
  }

  isShieldStunState(id: number): boolean {
    return id === ActionStateId.ShieldStun;
  }

  isShieldBreakState(id: number): boolean {
    return (
      id === ActionStateId.ShieldBreakFly ||
      id === ActionStateId.ShieldBreakFall ||
      id === ActionStateId.ShieldBreakDownBound ||
      id === ActionStateId.ShieldBreakStand ||
      id === ActionStateId.FuraFura
    );
  }

  isGrabState(id: number): boolean {
    return (
      id === ActionStateId.Grab ||
      id === ActionStateId.GrabPull ||
      id === ActionStateId.GrabWait
    );
  }

  isLedgeState(id: number): boolean {
    return id >= 0x054 && id <= 0x063;
  }

  isNAOriginal12(id: number): boolean {
    return isNAOriginal12Id(id);
  }

  isJPOriginal12(id: number): boolean {
    return isJPOriginal12Id(id);
  }

  getCharacterGroup(id: number): CharacterGroup {
    return getCharacterGroupId(id);
  }
}

const definitionsCache = new Map<string, GameDefinitions>();

export function getGameDefinitions(goodName?: string): GameDefinitions {
  const name =
    goodName && goodName.trim().length > 0
      ? goodName
      : GoodName.SmashRemix2_0_1;
  let defs = definitionsCache.get(name);
  if (!defs) {
    defs = new StandardGameDefinitions(name);
    definitionsCache.set(name, defs);
  }
  return defs;
}

export function getCharacterName(
  id: number,
  langOrOptions?: Language | LookupOptions,
): string {
  const { lang, goodName } = resolveLangAndGoodName(langOrOptions);
  return getGameDefinitions(goodName).getCharacterName(id, lang);
}

export function getStageName(
  id: number,
  langOrOptions?: Language | LookupOptions,
): string {
  const { lang, goodName } = resolveLangAndGoodName(langOrOptions);
  return getGameDefinitions(goodName).getStageName(id, lang);
}

export function getActionStateName(
  id: number,
  langOrOptions?: Language | LookupOptions,
): string {
  const { lang, goodName, characterId } = resolveLangAndGoodName(langOrOptions);
  return getGameDefinitions(goodName).getActionStateName(id, lang, characterId);
}

export function isJigglypuffCharacter(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isJigglypuffCharacter(id);
}

export function isNessCharacter(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isNessCharacter(id);
}

export function isYoshiCharacter(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isYoshiCharacter(id);
}

export function isFoxCharacter(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isFoxCharacter(id);
}

export function isMarioCharacter(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isMarioCharacter(id);
}

export function isLuigiCharacter(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isLuigiCharacter(id);
}

export function isDonkeyKongCharacter(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isDonkeyKongCharacter(id);
}

export function isSamusCharacter(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isSamusCharacter(id);
}

export function isLinkCharacter(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isLinkCharacter(id);
}

export function isCaptainFalconCharacter(
  id: number,
  goodName?: string,
): boolean {
  return getGameDefinitions(goodName).isCaptainFalconCharacter(id);
}

export function isKirbyCharacter(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isKirbyCharacter(id);
}

export function isPikachuCharacter(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isPikachuCharacter(id);
}

export function isShieldState(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isShieldState(id);
}

export function isShieldStunState(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isShieldStunState(id);
}

export function isShieldBreakState(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isShieldBreakState(id);
}

export function isGrabState(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isGrabState(id);
}

export function isLedgeState(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isLedgeState(id);
}

export function isNAOriginal12(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isNAOriginal12(id);
}

export function isJPOriginal12(id: number, goodName?: string): boolean {
  return getGameDefinitions(goodName).isJPOriginal12(id);
}

export function getCharacterGroup(
  id: number,
  goodName?: string,
): CharacterGroup {
  return getGameDefinitions(goodName).getCharacterGroup(id);
}

// ---------------------------------------------------------------------------
// Item/Weapon kinds (docs/RMGR_SPEC.md section 7.6) - ItemUpdate.kind's
// enum, selected by ItemUpdate.linkId. SmashRemix2.0.1-specific (this is
// currently the only goodName the recorder ever emits ItemUpdate for), so
// unlike the character/stage/action-state lookups above, these aren't
// routed through GameDefinitions/getGameDefinitions.
//
// No Japanese names are provided - none are documented yet, and guessing
// would be worse than just returning the English name for both languages.
// ---------------------------------------------------------------------------

/** `ItemUpdate.linkId` wire values. */
export const ItemLinkId = {
  Item: 4,
  Weapon: 5,
} as const;

/**
 * Free-flying character special-move projectiles (`ItemUpdate.linkId ==
 * ItemLinkId.Weapon`). Confirmed against a real SSB64 decompilation
 * (VetriTheRetri/ssb-decomp-re) - see docs/RMGR_SPEC.md section 7.6.
 */
export const WPKind = {
  Fireball: 0x00,
  Blaster: 0x01,
  ChargeShot: 0x02,
  SamusBomb: 0x03,
  Cutter: 0x04,
  EggThrow: 0x05,
  YoshiStar: 0x06,
  Boomerang: 0x07,
  SpinAttack: 0x08,
  ThunderJoltAir: 0x09,
  ThunderJoltGround: 0x0a,
  ThunderHead: 0x0b,
  ThunderTrail: 0x0c,
  PKFire: 0x0d,
  PKThunderHead: 0x0e,
  PKThunderTrail: 0x0f,
  BulletNormal: 0x10,
  BulletHard: 0x11,
  ArwingLaser2D: 0x12,
  ArwingLaser3D: 0x13,
  LGunAmmo: 0x14,
  FFlowerFlame: 0x15,
  StarRodStar: 0x16,
  // 0x17-0x1F: Pokémon/monster weapons, not individually enumerated.
} as const;

/**
 * Thrown/spawned items, stage hazard objects, and some fighter-held things
 * like Link's pulled bomb (`ItemUpdate.linkId == ItemLinkId.Item`). Two
 * values (`Bomb`, `PKFirePillar`) are confirmed directly against the
 * decomp; the rest is `Hazards.standard`/`stage`/`pokemon` from Smash
 * Remix's own `src/Hazards.asm`, which the decomp cross-check confirms
 * uses the same numbering. `Bumper`/`Chansey` legitimately appear twice at
 * different values - that's the source enum's own structure, not a
 * transcription error. See docs/RMGR_SPEC.md section 7.6.
 */
export const ITKind = {
  Crate: 0x00,
  Barrel: 0x01,
  Capsule: 0x02,
  Egg: 0x03,
  MaximTomato: 0x04,
  Heart: 0x05,
  Star: 0x06,
  BeamSword: 0x07,
  HomeRunBat: 0x08,
  Fan: 0x09,
  StarRod: 0x0a,
  RayGun: 0x0b,
  FireFlower: 0x0c,
  Hammer: 0x0d,
  MotionSensorBomb: 0x0e,
  BobOmb: 0x0f,
  Bumper: 0x10,
  GreenShell: 0x11,
  RedShell: 0x12,
  Pokeball: 0x13,
  PKFirePillar: 0x14,
  Bomb: 0x15,
  PowBlock: 0x16,
  StageBumper: 0x17,
  PiranhaPlant: 0x18,
  Target: 0x19,
  RTTFBomb: 0x1a,
  StageChansey: 0x1b,
  Electrode: 0x1c,
  Charmander: 0x1d,
  Venusaur: 0x1e,
  Porygon: 0x1f,
  Onix: 0x20,
  Snorlax: 0x21,
  Goldeen: 0x22,
  Meowth: 0x23,
  Charizard: 0x24,
  Beedrill: 0x25,
  Blastoise: 0x26,
  Chansey: 0x27,
  Starmie: 0x28,
  Hitmonlee: 0x29,
  Koffing: 0x2a,
  Clefairy: 0x2b,
  Mew: 0x2c,
  /** Custom, out-of-range - Bowser's Castle stadium bomb specifically. */
  BowserBomb: 0x011a,
} as const;

const WP_KIND_NAMES: Readonly<Record<number, string>> = Object.fromEntries(
  Object.entries(WPKind).map(([name, value]) => [value, name]),
);
const IT_KIND_NAMES: Readonly<Record<number, string>> = Object.fromEntries(
  Object.entries(ITKind).map(([name, value]) => [value, name]),
);

/**
 * Human-readable name for an `ItemUpdate`'s `(linkId, kind)` pair, e.g.
 * `"Boomerang"` or `"Bomb"`. Falls back to a hex-labeled placeholder for a
 * `kind` outside the confirmed ranges above (e.g. Remix's own mod-added
 * weapon IDs past `0x1F`, or a Pokémon/monster weapon `0x17`-`0x1F` not
 * individually named) - never throws.
 *
 * English only - unlike the character/stage/action-state lookups above, no
 * Japanese names are documented yet for these, and guessing would be worse
 * than not having a `lang` parameter at all.
 */
export function getItemKindName(linkId: number, kind: number): string {
  if (linkId === ItemLinkId.Weapon) {
    return WP_KIND_NAMES[kind] ?? `Weapon 0x${kind.toString(16)}`;
  }
  if (linkId === ItemLinkId.Item) {
    return IT_KIND_NAMES[kind] ?? `Item 0x${kind.toString(16)}`;
  }
  return `Unknown (linkId 0x${linkId.toString(16)}, kind 0x${kind.toString(16)})`;
}

// ---------------------------------------------------------------------------
// Remix Toggles.asm Gameplay/Stage Settings (MatchSettings, recorder schema
// 3+ - docs/RMGR_SPEC.md sections 5.1.1/5.1.2). Values verified directly
// against the Smash Remix 2.0.1 source build. SmashRemix2.0.1-specific, like
// the item/weapon kinds above - not routed through GameDefinitions.
// ---------------------------------------------------------------------------

/** `RemixGameplaySettings`/`RemixStageSettings` field names - the keys `getRemixSettingValueName()` accepts. */
export type RemixSettingField =
  | keyof import("./types.js").RemixGameplaySettings
  | keyof import("./types.js").RemixStageSettings;

const REMIX_GAMEPLAY_SETTING_VALUE_NAMES: Readonly<
  Record<string, readonly string[]>
> = {
  hitstun: ["Normal", "Melee"],
  hitlag: ["Normal", "Japanese", "Melee", "Ultimate", "None"],
  di: ["Normal", "Japanese", "Ultimate"],
  japaneseSounds: ["Default", "Always", "Never"],
  japaneseStunSleep: ["Off", "On"],
  momentumSlide: ["Off", "On"],
  shieldStun: ["Default", "Japanese", "Melee", "Brawl", "Ultimate"],
  zCancel: ["Default", "Disabled", "Melee (7 frames)", "Auto", "Glide Mode"],
  punishFailedZCancel: [
    "Off",
    "7% Damage",
    "Lava Floor",
    "Shield-Break",
    "Instant K.O.",
    "Force Taunt",
    "Bury",
    "Laugh Track",
    "Egg",
    "Sleep",
    "Trip",
    "Random",
  ],
  improvedAI: ["Off", "On"],
  tripping: ["Off", "Low", "High", '"Brawl"'],
  rage: ["Off", "Ultimate", "Smash 4", "Berserk", "Fatigue"],
  footstoolJumping: ["Off", "On"],
  airDodging: ["Off", "Melee", "Ultimate", "Air Dash"],
  jabLocking: ["Off", "On"],
  edgeCJumping: ["Off", "On"],
  perfectShielding: ["Off", "On"],
  parrying: ["Off", "On"],
  spotDodging: ["Off", "On"],
  fastFallAerials: ["Off", "On"],
  ledgeTrumping: ["Off", "On"],
  wallTeching: ["Off", "On"],
  chargeSmashes: ["Off", "On", "Unlimited Charge"],
  itemContainers: ["Default", "Off", "Never Explode", "Always Explode"],
  gameSpeed: [
    "1/1",
    "1.2x",
    "1.3x",
    "1.5x",
    "1.75x",
    "2.0x",
    "3.0x",
    "1/8",
    "1/4",
    "1/3",
    "1/2",
    "2/3",
    "3/4",
  ],
  specialZoom: ["Off", "Match End", "Any KO"],
  blastzoneWarp: ["Off", "Left/Right", "Top/Bottom", "All"],
  singleButtonMode: [
    "Off",
    '"A"',
    '"B"',
    '"R"',
    '"A"+"C"',
    '"B"+"C"',
    '"R"+"C"',
  ],
  allItemsRDropAerial: ["Off", "On"],
  moveStaling: [
    "Default",
    "Disabled",
    "Lenient",
    "Strict",
    "Wait For It",
    "Reverse",
    "Cheap Shot",
  ],
  stopwatchItem: [
    "Default",
    "Slow Always",
    "Fast Always",
    "Backfire Always",
    "Backfire Never",
  ],
};

const REMIX_STAGE_SETTING_VALUE_NAMES: Readonly<
  Record<string, readonly string[]>
> = {
  stageSelectLayout: ["Normal", "Tournament"],
  hazardMode: ["Normal", "Hazards Off", "Movement Off", "All Off"],
  whispyMode: ["Normal", "Japanese", "Super", "Hyper"],
  saffronPokemonRate: ["Normal", "Super", "Hyper", "Quick Attack"],
  pokemonAnnouncer: ["Stadium", "All Stages", "Off"],
  dragonKingHUD: ["Dragon King", "All Stages", "Off"],
  cameraMode: ["Normal", "Bonus", "Fixed", "Scene"],
  yoshiIslandCloudAnims: ["Off", "On"],
};

const REMIX_SETTING_VALUE_NAMES: Readonly<Record<string, readonly string[]>> = {
  ...REMIX_GAMEPLAY_SETTING_VALUE_NAMES,
  ...REMIX_STAGE_SETTING_VALUE_NAMES,
};

/**
 * Human-readable name for one Remix Gameplay/Stage Setting's raw value,
 * e.g. `getRemixSettingValueName("hitlag", 2)` → `"Melee"`. Falls back to
 * a bare-number placeholder for an out-of-range value or an unrecognized
 * field name - never throws. See `docs/RMGR_SPEC.md` §5.1.1/§5.1.2.
 */
export function getRemixSettingValueName(
  field: RemixSettingField | string,
  value: number,
): string {
  const names = REMIX_SETTING_VALUE_NAMES[field];
  return names?.[value] ?? `${field} ${value}`;
}
