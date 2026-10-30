import type { ContentRecord } from "../types.js";
const V = 1;
const r = (key: string, layer: 1 | 2, text: string, tags: string[] = []): ContentRecord => ({
  id: `numerology.lifePath.${key}.${layer}`, locale: "en", layer, text, tags: ["numerology", "lifePath", ...tags],
  source_note: "Pythagorean numerology, public knowledge; original copy for Daily Fate", status: "draft", version: V,
});
export const numerologyEn: ContentRecord[] = [
  r("1", 1, "You were born to lead: independent, decisive and always carving your own path."),
  r("1", 2, "Strengths: pioneering, willpower, self-reliance.\nWatch for: impatience, deaf to feedback.\nTry: listen before you decide."),
  r("2", 1, "You are the connector: sensitive, a good listener and skilled at calming conflict around you."),
  r("2", 2, "Strengths: cooperation, tact, patience.\nWatch for: easily hurt, over-yielding.\nTry: say what you need out loud."),
  r("3", 1, "You carry the energy of expression: creative, optimistic and inspiring others with your words."),
  r("3", 2, "Strengths: creativity, communication, humour.\nWatch for: scattered focus.\nTry: pick one project and finish it."),
  r("4", 1, "You are the foundation: practical, disciplined and a believer in steady work."),
  r("4", 2, "Strengths: organisation, reliability, persistence.\nWatch for: rigidity, fear of change.\nTry: leave room for surprises."),
  r("5", 1, "You crave freedom: curious, adaptable and fully alive in every new experience."),
  r("5", 2, "Strengths: adaptability, courage, versatility.\nWatch for: impulsiveness, boredom.\nTry: anchor freedom with a few commitments."),
  r("6", 1, "You are the caretaker: responsible, warm and always putting family and community first."),
  r("6", 2, "Strengths: love, fairness, thoughtfulness.\nWatch for: over-committing, self-sacrifice.\nTry: care for yourself first."),
  r("7", 1, "You are the truth-seeker: deep, reflective and trusting intuition over the crowd."),
  r("7", 2, "Strengths: analysis, intuition, independent thinking.\nWatch for: withdrawal, cynicism.\nTry: share what you understand with someone."),
  r("8", 1, "You carry the energy of power and money: ambitious, practical and good at turning ideas into results."),
  r("8", 2, "Strengths: leadership, management, stamina.\nWatch for: perfectionism, measuring everything by achievement.\nTry: success needs company too."),
  r("9", 1, "You have a humanitarian heart: tolerant, idealistic and wanting to leave the world better."),
  r("9", 2, "Strengths: generosity, creativity, broad vision.\nWatch for: trouble letting go, disappointment in others.\nTry: give, but keep your boundaries."),
  r("11", 1, "You are the master number of intuition: perceptive, inspiring and seeing what others miss.", ["master"]),
  r("11", 2, "Strengths: intuition, idealism, inspiration.\nWatch for: anxiety, self-made pressure.\nTry: ground yourself with simple daily habits.", ["master"]),
  r("22", 1, "You are the master builder: able to turn big dreams into real structures with enough patience.", ["master"]),
  r("22", 2, "Strengths: vision, discipline, large-scale execution.\nWatch for: fear of failure, self-doubt.\nTry: break the big goal into small steps.", ["master"]),
  r("33", 1, "You are the master number of love: healing, teaching and lifting others is your calling.", ["master"]),
  r("33", 2, "Strengths: compassion, guidance, healing.\nWatch for: burnout from carrying others.\nTry: set limits on your kindness.", ["master"]),
];
