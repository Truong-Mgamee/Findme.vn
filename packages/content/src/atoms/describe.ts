/**
 * Turn an atom key into a short reference brief for the drafting prompt: localized term labels
 * plus whatever public-domain source text we hold (Waite 1911 for tarot, Legge 1882 for I Ching).
 */
import { ELEMENT_TERMS, NAYIN_TERMS, STEM_TERMS, TEN_GOD_TERMS, type TenGodKey } from '@findme/engine-bazi';
import { XIU_TERMS, YIJI_TERMS, ZHIXING_TERMS } from '@findme/engine-almanac';
import deckJson from '../../tarot/deck-classic-1909.json' with { type: 'json' };
import hexJson from '../../iching/hexagrams.json' with { type: 'json' };
import { glossaryFor } from './glossary.js';
import { CONTENT_ROOT } from './store.js';
import { traditionOfKey } from './schema.js';

type Card = { id: string; name_en: string; arcana: string; suit: string | null; number: number; keywords_upright: string[]; keywords_reversed: string[]; element: string; astrology: string; waite_pd_excerpt: string };
type Hex = { number: number; name_zh: string; name_pinyin: string; name_en: string; name_en_modern: string; judgment_en: string; image_en: string; lines: Array<{ position: number; text_en: string }>; name_vi: string };
const CARDS = new Map((deckJson as { cards: Card[] }).cards.map((c) => [c.id, c]));
const HEXES = new Map((hexJson as { hexagrams: Hex[] }).hexagrams.map((h) => [h.number, h]));

export interface KeyBrief {
  key: string;
  /** suggested title in the locale (editors may override) */
  title: string;
  /** one-paragraph brief: what the key denotes + source excerpt where available */
  reference: string;
  /** glossary term keys involved (for the prompt's glossary subset) */
  terms: string[];
}

const NUM_SLUG: Record<string, string> = { lifepath: 'numerology.lifepath', expression: 'numerology.expression', soulurge: 'numerology.soulurge', personality: 'numerology.personality', birthday: 'numerology.birthday', maturity: 'numerology.maturity', personalyear: 'numerology.personalyear', personalmonth: 'numerology.personalmonth', personalday: 'numerology.personalday', karmic: 'numerology.karmic', master: 'numerology.master' };
const PILLAR_LABEL: Record<string, Record<string, string>> = {
  vi: { year: 'trụ năm', month: 'trụ tháng', hour: 'trụ giờ' },
  en: { year: 'year pillar', month: 'month pillar', hour: 'hour pillar' },
};
const STRENGTH_LABEL: Record<string, Record<string, string>> = {
  vi: { strong: 'thân vượng', weak: 'thân nhược', balanced: 'trung hòa' },
  en: { strong: 'strong day master', weak: 'weak day master', balanced: 'balanced day master' },
};
const UPRIGHT: Record<string, Record<string, string>> = { vi: { upright: 'xuôi', reversed: 'ngược' }, en: { upright: 'upright', reversed: 'reversed' } };
const MOON_PHASE_LABEL: Record<string, string> = { new: 'New Moon', waxingCrescent: 'Waxing Crescent', firstQuarter: 'First Quarter', waxingGibbous: 'Waxing Gibbous', full: 'Full Moon', waningGibbous: 'Waning Gibbous', lastQuarter: 'Last Quarter', waningCrescent: 'Waning Crescent' };

function lang(locale: string): 'vi' | 'en' {
  return locale === 'vi' ? 'vi' : 'en';
}

export function describeKey(key: string, locale: string, root = CONTENT_ROOT): KeyBrief {
  const g = glossaryFor(locale, root);
  const L = lang(locale);
  const t = (termKey: string, fallback?: string) => g[termKey] ?? fallback ?? termKey;
  const parts = key.split('.');
  const terms: string[] = [];
  const use = (termKey: string, fallback?: string) => {
    terms.push(termKey);
    return t(termKey, fallback);
  };
  const tradition = traditionOfKey(key);
  const brief = (title: string, reference: string): KeyBrief => ({ key, title, reference, terms: [...new Set(terms)] });

  switch (tradition) {
    case 'ziwei': {
      const kind = parts[1];
      if (kind === 'star' && parts[2] && parts[4]) {
        const star = use(`star.${parts[2]}`);
        const palace = use(`palace.${parts[4]}`);
        return brief(L === 'vi' ? `${star} tại ${palace}` : `${star} in the ${palace}`, L === 'vi' ? `Chính tinh ${star} toạ thủ ${palace} trên lá số Tử Vi Đẩu Số: ý nghĩa khái quát của sao này khi đóng tại cung đó.` : `Major star ${star} residing in the ${palace} of a Zi Wei Dou Shu chart: the generic meaning of this star in this palace.`);
      }
      if (kind === 'soulstar' && parts[2]) {
        const star = use(`star.${parts[2]}`);
        use('ziwei.soulstar');
        return brief(L === 'vi' ? `Mệnh chủ ${star}` : `Life Master star ${star}`, L === 'vi' ? `Mệnh chủ (命主) là ${star}: khuynh hướng nền tảng của tính cách và cách người này tiếp cận cuộc sống.` : `The Life Master (命主) is ${star}: the baseline temperament and the way this person approaches life.`);
      }
      if (kind === 'bodystar' && parts[2]) {
        const star = use(`star.${parts[2]}`);
        use('ziwei.bodystar');
        return brief(L === 'vi' ? `Thân chủ ${star}` : `Body Master star ${star}`, L === 'vi' ? `Thân chủ (身主) là ${star}: cách người này hành động, bộc lộ ra bên ngoài sau tuổi trưởng thành.` : `The Body Master (身主) is ${star}: how this person acts and shows up outwardly, especially after mid-life.`);
      }
      if (kind === 'fiveclass' && parts[2]) {
        const c = use(`fiveclass.${parts[2]}`);
        return brief(c, L === 'vi' ? `Cục ${c}: nhịp vận hành của đại hạn (bắt đầu từ tuổi tương ứng) và khí chất ngũ hành nền của lá số.` : `Five-element class ${c}: sets the starting age of the decade cycles and the elemental temperament of the chart.`);
      }
      if (kind === 'pattern' && parts[2]) {
        const p = use(`pattern.${parts[2]}`);
        return brief(p, L === 'vi' ? `Cách cục ${p} trong Tử Vi: tổ hợp sao đặc trưng tại Mệnh hoặc tam phương tứ chính và điều nó gợi ý.` : `Zi Wei pattern ${p}: a characteristic star combination in or around the Life Palace and what it suggests.`);
      }
      if (kind === 'palace' && parts[2] && parts[3] === 'empty') {
        const palace = use(`palace.${parts[2]}`);
        use('ziwei.empty');
        return brief(L === 'vi' ? `${palace} vô chính diệu` : `${palace} without major stars`, L === 'vi' ? `${palace} không có chính tinh (vô chính diệu): mượn sao cung đối diện để luận, cung này linh hoạt và chịu ảnh hưởng từ bên ngoài.` : `The ${palace} has no major star (empty palace): read the opposite palace; this area is flexible and shaped by outside influences.`);
      }
      if (kind === 'bodypalace' && parts[2]) {
        const palace = use(`palace.${parts[2]}`);
        use('palace.bodyPalace');
        return brief(L === 'vi' ? `Thân cư ${palace}` : `Body Palace in the ${palace}`, L === 'vi' ? `Cung Thân đóng tại ${palace}: lĩnh vực đời sống chi phối nửa sau cuộc đời và nơi nỗ lực cá nhân dồn vào.` : `The Body Palace falls in the ${palace}: the life area that dominates the second half of life and where effort concentrates.`);
      }
      if (kind === 'mutagen' && parts[2] && parts[3] && parts[5]) {
        const star = use(`star.${parts[2]}`);
        const m = use(`mutagen.${parts[3]}`);
        const palace = use(`palace.${parts[5]}`);
        return brief(L === 'vi' ? `${star} ${m} tại ${palace}` : `${star} ${m} in the ${palace}`, L === 'vi' ? `${star} hoá ${m} (tứ hoá theo can năm sinh) đóng tại ${palace}: sắc thái mà phép hoá này thêm vào cho sao và cung.` : `${star} carrying ${m} (birth-year transformation) in the ${palace}: the nuance this transformation adds to the star and the palace.`);
      }
      if (kind === 'decadal' && parts[3]) {
        use('ziwei.decadal');
        return brief(L === 'vi' ? `Đại hạn đóng tại cung số ${parts[3]}` : `Decade cycle in palace index ${parts[3]}`, L === 'vi' ? `Đại hạn (大限) hiện tại đi qua cung có chỉ số ${parts[3]} (0 = Dần, đếm theo thứ tự iztro): giai đoạn mười năm chịu ảnh hưởng của cung đó.` : `The current decade cycle (大限) passes through palace index ${parts[3]} (0 = 寅 in iztro order): a ten-year stretch coloured by that palace.`);
      }
      if (kind === 'yearly' && parts[3]) {
        const star = use(`star.${parts[3]}`);
        use('ziwei.yearly');
        return brief(L === 'vi' ? `Lưu niên tứ hoá: ${star}` : `Annual transformation on ${star}`, L === 'vi' ? `Trong năm nay ${star} nhận một trong tứ hoá lưu niên: chủ đề của sao này được kích hoạt trong 12 tháng tới.` : `This year ${star} receives one of the annual four transformations: the theme of this star is activated for the coming twelve months.`);
      }
      break;
    }
    case 'bazi': {
      const kind = parts[1];
      if (kind === 'daymaster' && parts[2]) {
        const stem = use(`stem.${parts[2]}`);
        const idx = Number(parts[2]);
        const el = use(`element.${[0, 0, 1, 1, 2, 2, 3, 3, 4, 4][idx] ?? 0}`);
        use('bazi.daymaster');
        if (parts[3]) {
          const s = STRENGTH_LABEL[L]![parts[3]] ?? parts[3];
          return brief(L === 'vi' ? `Nhật chủ ${stem}, ${s}` : `${stem} day master, ${s}`, L === 'vi' ? `Nhật chủ ${stem} (${el}) ở trạng thái ${s}: cách năng lượng bản mệnh vận hành khi được/không được mùa sinh và các trụ khác trợ lực.` : `Day master ${stem} (${el}) assessed as ${s}: how the self-element behaves when it is (or is not) supported by the season and the other pillars.`);
        }
        return brief(L === 'vi' ? `Nhật chủ ${stem}` : `${stem} day master`, L === 'vi' ? `Nhật chủ (can ngày) là ${stem}, hành ${el}: hình ảnh cổ điển của can này và khí chất nền tảng.` : `The day master (day stem) is ${stem}, element ${el}: the classical image of this stem and its baseline temperament.`);
      }
      if (kind === 'shishen' && parts[2] && parts[3]) {
        const god = use(`tengod.${parts[2]}`);
        const pillar = PILLAR_LABEL[L]![parts[3]] ?? parts[3];
        return brief(L === 'vi' ? `${god} ở ${pillar}` : `${god} on the ${pillar}`, L === 'vi' ? `Thập thần ${god} lộ ở can ${pillar}: ý nghĩa của thần này và lĩnh vực đời sống/giai đoạn tuổi mà trụ đó đại diện.` : `Ten God ${god} appearing on the ${pillar} stem: what this god means and the life area / life stage the pillar stands for.`);
      }
      if (kind === 'nayin' && parts[2]) {
        const n = NAYIN_TERMS[Number(parts[2])];
        use('bazi.nayin');
        const label = n ? (L === 'vi' ? `${n.vi} (${n.han})` : `${n.en} (${n.han})`) : parts[2];
        return brief(L === 'vi' ? `Nạp âm ${label}` : `Nayin ${label}`, L === 'vi' ? `Nạp âm ${label}: hình tượng ngũ hành của cặp can chi này và sắc thái nó mang lại cho trụ.` : `Nayin (melodic element) ${label}: the elemental image of this stem-branch pair and the flavour it gives the pillar.`);
      }
      if (kind === 'monthqi' && parts[2]) {
        const god = use(`tengod.${parts[2]}`);
        use('bazi.monthqi');
        return brief(L === 'vi' ? `Nguyệt lệnh: ${god}` : `Month command: ${god}`, L === 'vi' ? `Bản khí của chi tháng (nguyệt lệnh) là ${god}: khí mùa sinh định hình chủ đề lớn nhất của lá số.` : `The main hidden stem of the month branch is ${god}: the seasonal command sets the chart's dominant theme.`);
      }
      if (kind === 'useful' && parts[2]) {
        const el = use(`element.${parts[2]}`);
        use('bazi.useful');
        return brief(L === 'vi' ? `Dụng thần ${el}` : `Useful element ${el}`, L === 'vi' ? `Hành ${el} là dụng thần: hành cân bằng lá số; màu sắc, phương hướng, ngành nghề, thói quen thuộc hành này hỗ trợ.` : `${el} is the useful element: it balances the chart; colours, directions, fields and habits of this element support the person.`);
      }
      if (kind === 'dayun' && parts[2]) {
        const god = use(`tengod.${parts[2]}`);
        use('bazi.dayun');
        return brief(L === 'vi' ? `Đại vận ${god}` : `${god} luck period`, L === 'vi' ? `Can của đại vận hiện tại là ${god}: chủ đề mười năm này xoay quanh thần đó.` : `The current ten-year luck period stem is ${god}: the decade's theme revolves around this god.`);
      }
      if (kind === 'element' && parts[3]) {
        const el = use(`element.${parts[3]}`);
        return brief(L === 'vi' ? `Hành ${el} vượng nhất` : `${el} dominates the chart`, L === 'vi' ? `Ngũ hành ${el} chiếm ưu thế trong tứ trụ: khí chất nổi bật và điểm dễ thái quá.` : `${el} is the most abundant element in the four pillars: the standout temperament and where excess shows.`);
      }
      break;
    }
    case 'almanac': {
      const kind = parts[1];
      if (kind === 'tianshen' && parts[2]) {
        const k = use(parts[2] === 'huangdao' ? 'almanac.huangdao' : 'almanac.heidao');
        return brief(k, L === 'vi' ? `Ngày ${k} theo thập nhị thần (hoàng đạo/hắc đạo): mức độ thuận lợi chung của ngày.` : `A ${k} day under the twelve day-deities (黃道/黑道): the day's general favourability.`);
      }
      if (kind === 'zhixing' && parts[2]) {
        const z = ZHIXING_TERMS[parts[2]];
        use(`zhixing.${parts[2]}`);
        const label = z ? (L === 'vi' ? `${z.vi} (${parts[2]})` : `${z.en} (${parts[2]})`) : parts[2];
        return brief(L === 'vi' ? `Trực ${label}` : `Day officer ${label}`, L === 'vi' ? `Trực ${label} trong Kiến Trừ thập nhị khách: việc hợp và việc kỵ của ngày mang trực này.` : `Day officer ${label} of the Jianchu twelve: what this kind of day suits and what it does not.`);
      }
      if (kind === 'xiu' && parts[2]) {
        const x = XIU_TERMS[parts[2]];
        use('almanac.xiu');
        const label = x ? (L === 'vi' ? `${x.vi} (${parts[2]})` : `${x.en} (${parts[2]})`) : parts[2];
        return brief(L === 'vi' ? `Sao ${label}` : `Mansion ${label}`, L === 'vi' ? `Nhị thập bát tú: ngày sao ${label} trực. Tính chất truyền thống của sao này với các việc trong ngày.` : `Twenty-eight mansions: the day is governed by ${label}. Its traditional character for the day's activities.`);
      }
      if (kind === 'ninestar' && parts[2]) {
        use('almanac.ninestar');
        return brief(L === 'vi' ? `Cửu tinh: sao số ${parts[2]}` : `Nine Star: star ${parts[2]}`, L === 'vi' ? `Sao số ${parts[2]} của Cửu tinh (Lạc thư) chiếu ngày: khí sắc và nhịp độ của ngày.` : `Star ${parts[2]} of the Nine Stars (Lo Shu) rules the day: the day's energy and tempo.`);
      }
      if ((kind === 'yi' || kind === 'ji') && parts[2]) {
        const term = YIJI_TERMS[parts[2]];
        const label = term ? (L === 'vi' ? `${term.vi} (${parts[2]})` : `${term.en} (${parts[2]})`) : parts[2];
        use(kind === 'yi' ? 'almanac.yi' : 'almanac.ji');
        return brief(L === 'vi' ? `${kind === 'yi' ? 'Nên' : 'Kỵ'}: ${label}` : `${kind === 'yi' ? 'Favourable' : 'Avoid'}: ${label}`, L === 'vi' ? `Hôm nay ${kind === 'yi' ? 'nên' : 'kỵ'} việc ${label}: việc này là gì trong đời sống hiện đại và cách tận dụng/tránh.` : `Today is ${kind === 'yi' ? 'favourable' : 'unfavourable'} for ${label}: what this activity means in modern life and how to use or avoid it.`);
      }
      if (kind === 'personal' && parts[2]) {
        if (parts[2] === 'clash') {
          use('almanac.clash');
          return brief(L === 'vi' ? 'Ngày xung tuổi' : 'Day clashes with your sign', L === 'vi' ? 'Chi ngày xung với chi năm sinh của bạn: ngày dễ dao động, nên tránh việc lớn và giữ nhịp nhẹ.' : 'The day branch clashes with your birth-year branch: an unsettled day, avoid big commitments and keep a light pace.');
        }
        use('bazi.useful');
        return brief(L === 'vi' ? 'Ngày hợp dụng thần' : 'Day carries your useful element', L === 'vi' ? 'Ngũ hành của ngày trùng với dụng thần của bạn: ngày thuận cho việc cần nỗ lực cá nhân.' : 'The day element matches your useful element: a supportive day for anything needing personal effort.');
      }
      break;
    }
    case 'tarot': {
      if (parts[1] === 'position' && parts[2] && parts[3]) {
        use('tarot.position');
        return brief(L === 'vi' ? `Vị trí "${parts[3]}" trong trải bài ${parts[2]}` : `Position "${parts[3]}" in the ${parts[2]} spread`, L === 'vi' ? `Ý nghĩa của vị trí ${parts[3]} trong trải bài ${parts[2]}: câu hỏi mà lá bài ở vị trí này trả lời.` : `What the ${parts[3]} position asks in the ${parts[2]} spread: the question the card placed here answers.`);
      }
      const card = CARDS.get(parts[1] ?? '');
      if (card && parts[2]) {
        const name = card.arcana === 'major' ? use(`tarot.${card.id}`, card.name_en) : card.name_en;
        if (card.suit) use(`suit.${card.suit}`);
        const orient = UPRIGHT[L]![parts[2]] ?? parts[2];
        const kw = (parts[2] === 'reversed' ? card.keywords_reversed : card.keywords_upright).join(', ');
        return brief(L === 'vi' ? `${name} (${orient})` : `${name} (${orient})`, `${card.name_en}, ${parts[2]}. Keywords: ${kw}. Element ${card.element}; astrology ${card.astrology}. Waite (1911, public domain): ${card.waite_pd_excerpt}`);
      }
      break;
    }
    case 'iching': {
      const h = HEXES.get(Number(parts[2]));
      if (h) {
        use('iching.hexagram');
        const name = `${h.name_zh} ${h.name_pinyin} — ${h.name_en_modern}${h.name_vi ? ` (${h.name_vi})` : ''}`;
        if (parts[3] === 'line' && parts[4]) {
          use('iching.line');
          const line = h.lines[Number(parts[4]) - 1];
          return brief(L === 'vi' ? `Quẻ ${h.number} ${name}, hào ${parts[4]}` : `Hexagram ${h.number} ${name}, line ${parts[4]}`, `Changing line ${parts[4]} of hexagram ${h.number} ${name}. Legge (public domain): ${line?.text_en ?? ''} Judgment: ${h.judgment_en}`);
        }
        if (parts[3] === 'relating') {
          use('iching.relating');
          return brief(L === 'vi' ? `Quẻ biến ${h.number} ${name}` : `Relating hexagram ${h.number} ${name}`, `Hexagram ${h.number} ${name} as the RELATING (resulting) hexagram: where the situation is heading. Legge judgment: ${h.judgment_en} Image: ${h.image_en}`);
        }
        return brief(L === 'vi' ? `Quẻ ${h.number} ${name}` : `Hexagram ${h.number} ${name}`, `Hexagram ${h.number} ${name}. Legge (1882, public domain) judgment: ${h.judgment_en} Image: ${h.image_en}`);
      }
      break;
    }
    case 'numerology': {
      const slug = parts[1] ?? '';
      const label = use(NUM_SLUG[slug] ?? `numerology.${slug}`, slug);
      const n = parts[2] ?? '';
      return brief(`${label} ${n}`, L === 'vi' ? `${label} số ${n} trong Thần số học Pythagoras: ý nghĩa cốt lõi của con số ${n} khi đứng ở chỉ số này.` : `${label} ${n} in Pythagorean numerology: the core meaning of the number ${n} in this position.`);
    }
    case 'astro': {
      if (parts[1] === 'moon' && parts[2] === 'phase' && parts[3]) {
        use('planet.moon');
        return brief(MOON_PHASE_LABEL[parts[3]] ?? parts[3], `Lunar phase ${MOON_PHASE_LABEL[parts[3]] ?? parts[3]}: the mood and best use of this part of the lunar cycle.`);
      }
      if (parts[1] === 'retrograde' && parts[2]) {
        const p = use(`planet.${parts[2]}`);
        return brief(L === 'vi' ? `${p} nghịch hành` : `${p} retrograde`, `${p} is retrograde (apparent backward motion): review, revisit and slow down in this planet's domain.`);
      }
      if (parts[2] === 'retrograde' && parts[1]) {
        const p = use(`planet.${parts[1]}`);
        return brief(L === 'vi' ? `${p} nghịch hành khi sinh` : `Natal ${p} retrograde`, `${p} was retrograde at birth: this planet's function turns inward and matures through reflection.`);
      }
      if (parts[1] && parts[2]) {
        const point = use(`planet.${parts[1]}`);
        const sign = use(`sign.${parts[2]}`);
        return brief(L === 'vi' ? `${point} ở ${sign}` : `${point} in ${sign}`, `${point} placed in ${sign} (tropical zodiac): how this planetary function expresses through the sign's element and modality.`);
      }
      break;
    }
  }
  return brief(key, key);
}
