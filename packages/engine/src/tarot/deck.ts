/** 78-card Rider-Waite-Smith deck definition. Images: public-domain 1909 scans (see THIRD_PARTY_LICENSES). */
export type Arcana = "major" | "minor";
export type Suit = "wands" | "cups" | "swords" | "pentacles";

export interface TarotCard {
  /** stable id, e.g. "major-00", "cups-01", "swords-page" */
  id: string;
  index: number; // 0..77
  arcana: Arcana;
  number: number; // 0..21 major, 1..14 minor (11 page, 12 knight, 13 queen, 14 king)
  suit?: Suit;
  nameEn: string;
  /** keywords for the daily card (upright / reversed) – EN seed, content pack overrides per locale */
  upright: string[];
  reversed: string[];
}

const MAJOR: [string, string[], string[]][] = [
  ["The Fool", ["new beginnings", "spontaneity", "faith"], ["recklessness", "hesitation", "naivety"]],
  ["The Magician", ["willpower", "skill", "manifestation"], ["manipulation", "untapped talent", "trickery"]],
  ["The High Priestess", ["intuition", "mystery", "inner voice"], ["secrets", "withdrawal", "silence"]],
  ["The Empress", ["abundance", "nurturing", "creativity"], ["dependence", "smothering", "creative block"]],
  ["The Emperor", ["structure", "authority", "stability"], ["rigidity", "domination", "lack of discipline"]],
  ["The Hierophant", ["tradition", "guidance", "belief"], ["rebellion", "dogma", "unconventional path"]],
  ["The Lovers", ["union", "choice", "harmony"], ["imbalance", "misalignment", "indecision"]],
  ["The Chariot", ["determination", "control", "victory"], ["aggression", "lack of direction", "obstacles"]],
  ["Strength", ["courage", "patience", "compassion"], ["self-doubt", "weakness", "raw emotion"]],
  ["The Hermit", ["introspection", "solitude", "wisdom"], ["isolation", "loneliness", "withdrawal"]],
  ["Wheel of Fortune", ["change", "cycles", "destiny"], ["bad luck", "resistance", "setback"]],
  ["Justice", ["fairness", "truth", "cause and effect"], ["unfairness", "dishonesty", "avoidance"]],
  ["The Hanged Man", ["surrender", "pause", "new perspective"], ["stalling", "resistance", "delay"]],
  ["Death", ["ending", "transformation", "transition"], ["fear of change", "stagnation", "holding on"]],
  ["Temperance", ["balance", "moderation", "patience"], ["excess", "imbalance", "impatience"]],
  ["The Devil", ["attachment", "temptation", "shadow"], ["release", "freedom", "detachment"]],
  ["The Tower", ["sudden change", "upheaval", "revelation"], ["averted disaster", "fear of change", "delay"]],
  ["The Star", ["hope", "renewal", "inspiration"], ["despair", "disconnection", "lack of faith"]],
  ["The Moon", ["illusion", "intuition", "uncertainty"], ["clarity", "release of fear", "confusion lifting"]],
  ["The Sun", ["joy", "success", "vitality"], ["temporary gloom", "overconfidence", "sadness"]],
  ["Judgement", ["awakening", "reckoning", "renewal"], ["self-doubt", "refusal", "harsh judgement"]],
  ["The World", ["completion", "achievement", "wholeness"], ["incompletion", "delay", "lack of closure"]],
];

const RANK_NAMES = ["", "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"] as const;
const RANK_IDS = ["", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "page", "knight", "queen", "king"] as const;
const SUIT_NAME: Record<Suit, string> = { wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pentacles" };
const SUIT_THEME: Record<Suit, [string, string]> = {
  wands: ["energy", "burnout"], cups: ["emotion", "emotional loss"], swords: ["clarity", "conflict"], pentacles: ["material progress", "financial worry"],
};
const RANK_THEME: [string, string][] = [
  ["", ""], ["beginning", "missed opportunity"], ["partnership", "imbalance"], ["growth", "delay"], ["stability", "stagnation"],
  ["conflict", "resolution"], ["harmony", "nostalgia"], ["assessment", "doubt"], ["movement", "stalling"], ["fulfilment", "strain"],
  ["completion", "burden"], ["curiosity", "immaturity"], ["action", "haste"], ["mastery of feeling", "insecurity"], ["leadership", "control"],
];

export const DECK: readonly TarotCard[] = (() => {
  const cards: TarotCard[] = [];
  MAJOR.forEach(([name, up, rev], i) => {
    cards.push({ id: `major-${String(i).padStart(2, "0")}`, index: i, arcana: "major", number: i, nameEn: name, upright: up, reversed: rev });
  });
  (["wands", "cups", "swords", "pentacles"] as Suit[]).forEach((suit, si) => {
    for (let r = 1; r <= 14; r++) {
      const [st, sr] = SUIT_THEME[suit];
      const [rt, rr] = RANK_THEME[r]!;
      cards.push({
        id: `${suit}-${RANK_IDS[r]}`, index: 22 + si * 14 + (r - 1), arcana: "minor", number: r, suit,
        nameEn: `${RANK_NAMES[r]} of ${SUIT_NAME[suit]}`,
        upright: [rt, st], reversed: [rr, sr],
      });
    }
  });
  return cards;
})();

export function cardById(id: string): TarotCard | undefined {
  return DECK.find((c) => c.id === id);
}
