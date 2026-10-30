declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(y: number, m: number, d: number): Solar;
    static fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Solar;
    getLunar(): Lunar;
    getYear(): number; getMonth(): number; getDay(): number;
    toYmd(): string;
  }
  export class JieQi { getName(): string; getSolar(): Solar }
  export class Yun { getStartYear(): number; getStartMonth(): number; getStartDay(): number; getDaYun(): DaYun[] }
  export class DaYun { getStartYear(): number; getEndYear(): number; getStartAge(): number; getEndAge(): number; getGanZhi(): string; getIndex(): number }
  export class EightChar {
    toString(): string;
    getYear(): string; getMonth(): string; getDay(): string; getTime(): string;
    getYearGan(): string; getYearZhi(): string; getMonthGan(): string; getMonthZhi(): string;
    getDayGan(): string; getDayZhi(): string; getTimeGan(): string; getTimeZhi(): string;
    getYearWuXing(): string; getMonthWuXing(): string; getDayWuXing(): string; getTimeWuXing(): string;
    getYearNaYin(): string; getMonthNaYin(): string; getDayNaYin(): string; getTimeNaYin(): string;
    getYearShiShenGan(): string; getMonthShiShenGan(): string; getTimeShiShenGan(): string;
    getYearShiShenZhi(): string[]; getMonthShiShenZhi(): string[]; getDayShiShenZhi(): string[]; getTimeShiShenZhi(): string[];
    getYearHideGan(): string[]; getMonthHideGan(): string[]; getDayHideGan(): string[]; getTimeHideGan(): string[];
    getTaiYuan(): string; getMingGong(): string; getShenGong(): string;
    getYun(gender: number, sect?: number): Yun;
    setSect(sect: number): void;
  }
  export class Lunar {
    static fromYmd(y: number, m: number, d: number): Lunar;
    getSolar(): Solar;
    getYear(): number; getMonth(): number; getDay(): number;
    getYearInGanZhi(): string; getMonthInGanZhi(): string; getDayInGanZhi(): string; getTimeInGanZhi(): string;
    getYearInGanZhiByLiChun(): string;
    getYearShengXiao(): string; getDayShengXiao(): string;
    getXiu(): string; getXiuLuck(): string; getZhiXing(): string;
    getDayTianShen(): string; getDayTianShenType(): string; getDayTianShenLuck(): string;
    getDayPositionXi(): string; getDayPositionCai(): string; getDayPositionFu(): string;
    getDayPositionXiDesc(): string; getDayPositionCaiDesc(): string; getDayPositionFuDesc(): string;
    getDayChong(): string; getDayChongDesc(): string; getDaySha(): string;
    getDayYi(): string[]; getDayJi(): string[];
    getDayJiShen(): string[]; getDayXiongSha(): string[];
    getPengZuGan(): string; getPengZuZhi(): string;
    getJieQi(): string; getPrevJieQi(): JieQi; getNextJieQi(): JieQi;
    getEightChar(): EightChar;
    getYearNaYin(): string; getMonthNaYin(): string; getDayNaYin(): string;
    getTimeZhi(): string; getTimeGan(): string;
    getTimes(): { getGanZhi(): string; getTianShenLuck(): string; getTianShen(): string; getMinHm(): string; getMaxHm(): string }[];
    getYearGanByLiChun(): string; getYearZhiByLiChun(): string;
  }
}
