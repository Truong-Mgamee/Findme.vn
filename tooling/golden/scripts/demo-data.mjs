import { writeFileSync } from 'node:fs';
import { computeZiwei, computeZiweiHoroscope } from '@findme/engine-ziwei';
import { computeBazi } from '@findme/engine-bazi';
import { getDayAlmanac, personalizeAlmanac, pickDates } from '@findme/engine-almanac';
import { computeNumerology } from '@findme/engine-numerology';
import { dailyCard, drawCards } from '@findme/engine-tarot';
import { castHexagram } from '@findme/engine-iching';
import { dailySky, computeNatalChart } from '@findme/engine-astro';
import { resolveBirth } from '@findme/engine-calendar';
const today = process.argv[3] ?? new Date().toISOString().slice(0, 10);
const birth = { date: '1997-12-24', time: '12:00', timeUnknown: false, gender: 'female', place: { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, tz: 'Asia/Ho_Chi_Minh', country: 'VN' }, calendarStandard: 'vn' };
const rb = resolveBirth(birth);
const zw = computeZiwei(birth, { locale: 'vi' });
const h = computeZiweiHoroscope(birth, today, { locale: 'vi' });
const bz = computeBazi(birth, { locale: 'vi', now: today, annualWindow: 2 });
const alm = personalizeAlmanac(getDayAlmanac(today, 'vn', 'vi'), { yearBranch: rb.lunar.yearGanzhi.branch, usefulElements: bz.favorable.useful });
const num = computeNumerology({ birthDate: birth.date, fullName: 'Nguyễn Thị Linh', refDate: today });
const card = dailyCard(today, 'w:common').cards[0];
const spread = drawCards({ spread: 'three', seed: today + ':demo' });
const ic = castHexagram({ method: 'coins', seed: today + ':demo' });
const sky = dailySky(new Date(today + 'T05:00:00Z'));
const natal = computeNatalChart({ utc: rb.moment.utc, lat: birth.place.lat, lng: birth.place.lng, houseSystem: 'placidus' });
const picks = pickDates({ task: 'wedding', from: today, to: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10), profiles: [{ yearBranch: rb.lunar.yearGanzhi.branch }], standard: 'vn', locale: 'vi', limit: 5 });
const data = {
  today, birth: { ...birth, label: 'Linh, 24/12/1997 12:00, Hà Nội' },
  calendar: { lunar: rb.lunar, pillars: [rb.pillars.year.han, rb.pillars.month.han, rb.pillars.day.han, rb.pillars.hour?.han], solarCorrectionMinutes: rb.moment.solarCorrectionMinutes },
  ziwei: { soul: zw.soul, body: zw.body, five: zw.fiveElementsClass, soulBranch: zw.soulPalaceBranch, chineseDate: zw.chineseDate, patterns: zw.patterns, palaces: zw.palaces.map(p => ({ key: p.key, name: p.name, stem: p.stem.name, branch: p.branch.name, branchIdx: p.branch.index, isBody: p.isBodyPalace, majors: p.majorStars.map(s => ({ name: s.name, b: s.brightness?.name ?? '', m: s.mutagen?.name ?? '' })), minors: p.minorStars.map(s => s.name), decadal: p.decadal.range })), horoscope: { decadal: h.decadal, yearly: h.yearly, age: h.age.nominalAge } },
  bazi: { pillars: bz.pillars.map(p => ({ key: p.key, gz: p.ganzhi.han, stem: p.stemLabel, branch: p.branchLabel, tenGod: p.tenGodLabel, hidden: p.hiddenStems.map(x => x.label + '·' + x.tenGodLabel), nayin: p.nayin.label, stage: p.stage.label })), dayMaster: bz.dayMaster, strength: bz.strength, favorable: bz.favorable, scores: bz.elementScores, luck: bz.luck, annual: bz.annual },
  almanac: alm, picks: picks.map(p => ({ date: p.date, score: p.score, reasons: p.reasons, zhixing: p.almanac.zhixing.label, huangdao: p.almanac.huangdao, lunar: p.almanac.lunar })),
  numerology: { lifePath: num.lifePath, expression: num.expression, soulUrge: num.soulUrge, personality: num.personality, birthday: num.birthday, maturity: num.maturity, personalYear: num.personalYear, personalMonth: num.personalMonth, personalDay: num.personalDay },
  tarot: { daily: { id: card.card.id, name: card.card.name_en, reversed: card.reversed, kw: card.reversed ? card.card.keywords_reversed : card.card.keywords_upright }, spread: spread.cards.map(c => ({ pos: c.position, name: c.card.name_en, reversed: c.reversed, kw: c.reversed ? c.card.keywords_reversed : c.card.keywords_upright })) },
  iching: { lines: ic.lines, primary: { n: ic.primary.number, zh: ic.primary.name_zh, en: ic.primary.name_en_modern ?? ic.primary.name_en, judgment: ic.primary.judgment_en }, changing: ic.changingLines, relating: ic.relating ? { n: ic.relating.number, zh: ic.relating.name_zh, en: ic.relating.name_en_modern ?? ic.relating.name_en } : null },
  sky: { sun: sky.sun.sign, moon: sky.moon.sign, phase: sky.moon.phase.name, retro: sky.retrogrades },
  natal: { sun: natal.sun, moon: natal.moon, rising: natal.rising, planets: natal.planets.slice(0, 10).map(p => ({ body: p.body, sign: p.sign, deg: Math.round(p.degree), retro: p.retrograde, house: p.house })) },
};
writeFileSync(process.argv[2], JSON.stringify(data));
console.log('ok', Object.keys(data).join(','), JSON.stringify(data).length);
