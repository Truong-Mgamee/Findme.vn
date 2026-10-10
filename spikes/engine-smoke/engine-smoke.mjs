import { astro } from 'iztro';
import { Solar, Lunar, I18n } from 'lunar-typescript';
import * as vn from 'lunar-date-vn';
import * as Astronomy from 'astronomy-engine';

// 1) iztro: lá số vi-VN, sinh 1997-12-24, giờ Ngọ (index 6), nữ
const a = astro.bySolar('1997-12-24', 6, '女', true, 'vi-VN');
console.log('IZTRO soul/body:', a.soul, a.body, '| fiveElementsClass:', a.fiveElementsClass, '| zodiac:', a.zodiac, '| sign:', a.sign);
console.log('IZTRO palaces:', a.palaces.map(p => `${p.name}:${p.majorStars.map(s=>s.name+(s.brightness?'('+s.brightness+')':'')+(s.mutagen?'['+s.mutagen+']':'')).join(',')}`).slice(0,4).join(' | '));
const h = a.horoscope('2026-10-10');
console.log('IZTRO horoscope decadal:', h.decadal.name, h.decadal.heavenlyStem+h.decadal.earthlyBranch, '| yearly:', h.yearly.heavenlyStem+h.yearly.earthlyBranch, 'mutagen', h.yearly.mutagen);

// 2) lunar-typescript: Bát tự + đại vận + lịch ngày
const s = Solar.fromYmdHms(1997,12,24,12,0,0);
const l = s.getLunar();
const ec = l.getEightChar();
console.log('BAZI:', ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime(), '| shishen:', ec.getYearShiShenGan(), ec.getMonthShiShenGan(), ec.getTimeShiShenGan(), '| nayin:', ec.getDayNaYin());
const yun = ec.getYun(0); // 0 = nữ
console.log('YUN start:', yun.getStartYear(),'y',yun.getStartMonth(),'m', '| DaYun:', yun.getDaYun().slice(0,4).map(d=>`${d.getStartYear()}:${d.getGanZhi()}`).join(' '));
const today = Solar.fromYmd(2026,10,10).getLunar();
console.log('TODAY lunar(CN):', today.toString(), '| yi:', today.getDayYi().slice(0,4).join(','), '| ji:', today.getDayJi().slice(0,3).join(','), '| zhiXing:', today.getZhiXing(), '| xiu:', today.getXiu(), today.getXiuLuck(), '| nineStar:', today.getDayNineStar().toString(), '| chong:', today.getDayChongDesc());
I18n.setLanguage('en'); console.log('EN:', Solar.fromYmd(2026,10,10).getLunar().toString(), Solar.fromYmd(2026,10,10).getLunar().getDayYi().slice(0,3).join(','));
I18n.setLanguage('chs');

// 3) VN vs CN lunar divergence: Tết 1985 and 2007
for (const [y,m,d] of [[1985,1,21],[1985,2,20],[2007,2,17],[2007,2,18],[2030,2,3],[2030,2,2]]) {
  const cn = Solar.fromYmd(y,m,d).getLunar();
  const v = new vn.SolarDate({day:d, month:m, year:y}).toLunarDate();
  console.log(`DIVERGE ${y}-${m}-${d}: CN lunar=${cn.getYear()}/${cn.getMonth()}/${cn.getDay()}  VN lunar=${v.get().year}/${v.get().month}/${v.get().day}`);
}

// 4) astronomy-engine: Sun/Moon ecliptic longitude -> zodiac sign
const t = new Date('1997-12-24T05:00:00Z');
const sun = Astronomy.SunPosition(t); const moonEq = Astronomy.GeoMoon(t); const moonEcl = Astronomy.Ecliptic(moonEq);
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
console.log('ASTRO sun lon', sun.elon.toFixed(2), signs[Math.floor(sun.elon/30)], '| moon lon', moonEcl.elon.toFixed(2), signs[Math.floor(moonEcl.elon/30)]);
