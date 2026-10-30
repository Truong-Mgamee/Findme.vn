import type { EngineWarning } from '@findme/engine-core';

export type NumerologySystem = 'pythagorean' | 'chaldean';

/**
 * Which word of the full name is the given (first) name.
 * - 'given-first' (Western, default): "John Smith" → given name "John".
 * - 'family-first' (Vietnamese/East-Asian order): "Nguyễn Văn An" → given name "An".
 * Only affects cornerstone/capstone, which are read from the given name.
 */
export type NameOrder = 'given-first' | 'family-first';

export interface NumerologyNumber {
  /** Final reduced value (1–9, or 11/22/33 when a master number is kept). */
  value: number;
  /** The total before the final reduction step (what karmic-debt detection looks at). */
  unreduced: number;
  /** true when value is 11, 22 or 33. */
  isMaster: boolean;
}

export type KarmicDebtNumber = 13 | 14 | 16 | 19;
export type KarmicDebtSource = 'lifePath' | 'expression' | 'birthday';
export interface KarmicDebt {
  number: KarmicDebtNumber;
  source: KarmicDebtSource;
}

export interface AgeRange {
  from: number;
  /** null = open ended (last pinnacle/challenge). */
  to: number | null;
}

export interface CycleNumber extends NumerologyNumber {
  index: 1 | 2 | 3 | 4;
  ages: AgeRange;
}

export interface HiddenPassion {
  /** Most frequent letter value in the name. Ties are broken toward the lowest digit; see `ties`. */
  value: number;
  count: number;
  /** All values sharing the top count (including `value`), ascending. */
  ties: number[];
}

export interface LetterNumber {
  letter: string;
  value: number;
}

export interface NameNumbers {
  input: string;
  /** Normalized A–Z letters, no separators. */
  letters: string;
  /** Normalized words (A–Z only), in input order. */
  words: string[];
  expression: NumerologyNumber;
  soulUrge: NumerologyNumber;
  personality: NumerologyNumber;
  hiddenPassion: HiddenPassion;
  cornerstone: LetterNumber;
  capstone: LetterNumber;
}

export interface NormalizedName {
  /** A–Z letters only, concatenated. '' when the script is unsupported. */
  letters: string;
  /** A–Z words, in input order (empty words removed). */
  words: string[];
  warnings: EngineWarning[];
}

export interface NumerologyInput {
  /** Gregorian birth date YYYY-MM-DD. */
  birthDate: string;
  /** Full name at birth (used for expression / soul urge / personality / maturity / hidden passion / cornerstone / capstone). */
  fullName?: string;
  /** Name currently used; computed separately into `currentName`. */
  currentName?: string;
  /** Default 'pythagorean'. */
  system?: NumerologySystem;
  /** Reference date YYYY-MM-DD for personal year/month/day. Default: today (device local date). */
  refDate?: string;
  /** Default 'given-first'. */
  nameOrder?: NameOrder;
}

export interface NumerologyResult {
  system: NumerologySystem;
  birthDate: string;
  refDate: string;
  nameOrder: NameOrder;

  // Date-based
  lifePath: NumerologyNumber;
  birthday: NumerologyNumber;

  // Name-based (null when no usable name)
  expression: NumerologyNumber | null;
  soulUrge: NumerologyNumber | null;
  personality: NumerologyNumber | null;
  maturity: NumerologyNumber | null;
  hiddenPassion: HiddenPassion | null;
  cornerstone: LetterNumber | null;
  capstone: LetterNumber | null;
  /** Normalized letters of the birth name, or null. */
  nameLetters: string | null;

  // Cycles
  personalYear: NumerologyNumber;
  personalMonth: NumerologyNumber;
  personalDay: NumerologyNumber;
  challenges: [CycleNumber, CycleNumber, CycleNumber, CycleNumber];
  pinnacles: [CycleNumber, CycleNumber, CycleNumber, CycleNumber];

  karmicDebt: KarmicDebt[];
  /** Distinct master numbers (11/22/33) appearing in lifePath/birthday/expression/soulUrge/personality/maturity, ascending. */
  masters: number[];

  /** Numbers for the current (used) name, when supplied and supported. */
  currentName: NameNumbers | null;

  /** false when no name was given or its script is unsupported. */
  nameSupported: boolean;
  warnings: EngineWarning[];
}

export interface CompatibilityReason {
  key: string;
  weight: number;
}

export interface CompatibilityResult {
  /** 0–100 */
  score: number;
  reasons: CompatibilityReason[];
}
