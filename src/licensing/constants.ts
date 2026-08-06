export const LICENSE_ENGINE_VERSION = '2.1' as const;
export const LICENSE_SCHEMA_VERSION = 1 as const;
export const LICENSE_CODE_GROUPS = 4 as const;
export const LICENSE_CODE_GROUP_LENGTH = 4 as const;
export const LICENSE_CODE_RAW_LENGTH = 16 as const;
export const LICENSE_PAYLOAD_LENGTH = 15 as const;

/**
 * Alfabeto sicuro ufficiale. Sono esclusi i caratteri visivamente ambigui:
 * O/0, I/1/L, S/5 e Z/2.
 */
export const SAFE_ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N',
  'P', 'Q', 'R', 'T', 'U', 'V', 'W', 'X', 'Y',
  '3', '4', '6', '7', '8', '9',
] as const;

export type SafeChar = (typeof SAFE_ALPHABET)[number];
