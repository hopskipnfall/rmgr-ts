export { parseReplay, ReplayParseError } from "./parse.js";
export { serializeReplay } from "./serialize.js";
export { deflate, inflate } from "./compression.js";
export { getFrame, getPortTimeline, getSeatedPorts } from "./query.js";
export type { PortFrame } from "./query.js";

export {
  ButtonBit,
  EventCode,
  FORMAT_VERSION,
  HazardFlag,
  MAGIC,
  SMASH_64_FAMILY,
  hasButton,
  hasHazardFlag,
} from "./constants.js";

export {
  ActionStateId,
  ACTION_STATE_NAMES,
  ACTION_STATE_NAMES_JA,
  CharacterId,
  CHARACTER_NAMES,
  CHARACTER_NAMES_JA,
  GoodName,
  ITKind,
  ItemLinkId,
  JP_ORIGINAL_12_IDS,
  NA_ORIGINAL_12_IDS,
  StageId,
  STAGE_NAMES,
  STAGE_NAMES_JA,
  WPKind,
  getActionStateName,
  getCharacterGroup,
  getCharacterName,
  getGameDefinitions,
  getItemKindName,
  getStageName,
  isFoxCharacter,
  isGrabState,
  isJigglypuffCharacter,
  isJPOriginal12,
  isLedgeState,
  isMarioCharacter,
  isNAOriginal12,
  isNessCharacter,
  isShieldBreakState,
  isShieldState,
  isShieldStunState,
  isYoshiCharacter,
} from "./lookups.js";

export type {
  CharacterGroup,
  GameDefinitions,
  Language,
  LookupOptions,
} from "./lookups.js";

export type {
  Frame,
  FramePortData,
  GameEndReason,
  HandicapMode,
  InputFrame,
  ItemUpdate,
  MatchEnd,
  MatchResult,
  MatchSettings,
  MatchStart,
  PortIndex,
  Replay,
  ReplayHeader,
  SerializableReplay,
  SlotType,
  StateFrame,
} from "./types.js";
