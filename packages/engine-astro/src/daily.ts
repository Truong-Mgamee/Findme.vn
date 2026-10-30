/**
 * Daily sky facts for the Daily Oracle job, atom-key derivation and the engine-core envelope.
 */
import type { Confidence, ReadingEngineOutput } from '@findme/engine-core';
import type { NatalChart } from './chart.js';
import { ENGINE_ID, ENGINE_VERSION } from './chart.js';
import type { BodyKey, MoonPhaseInfo } from './positions.js';
import { bodyPosition, moonPhase, planetPositions } from './positions.js';
import type { SignKey } from './zodiac.js';
import { signFromLongitude } from './zodiac.js';

export interface DailySky {
  /** ISO instant the sky was evaluated for */
  utc: string;
  sun: { sign: SignKey; lon: number };
  moon: { sign: SignKey; lon: number; phase: MoonPhaseInfo };
  /** Bodies currently retrograde (never includes sun/moon; node excluded as it is always retrograde). */
  retrogrades: BodyKey[];
}

/**
 * Snapshot of the sky at a UTC instant. Callers decide the instant (e.g. local noon of the
 * user's day) — the Moon moves ~13°/day so the choice matters for sign boundaries.
 */
export function dailySky(dateUTC: Date): DailySky {
  const positions = planetPositions(dateUTC);
  const sun = bodyPosition('sun', dateUTC);
  const moon = bodyPosition('moon', dateUTC);
  return {
    utc: dateUTC.toISOString(),
    sun: { sign: signFromLongitude(sun.lon).sign, lon: sun.lon },
    moon: { sign: signFromLongitude(moon.lon).sign, lon: moon.lon, phase: moonPhase(dateUTC) },
    retrogrades: positions.filter((p) => p.retrograde && p.body !== 'northNode').map((p) => p.body),
  };
}

/** content_atoms keys for a daily sky snapshot. */
export function atomKeysForDailySky(sky: DailySky): string[] {
  return [
    `astro.sun.${sky.sun.sign}`,
    `astro.moon.${sky.moon.sign}`,
    `astro.moon.phase.${sky.moon.phase.name}`,
    ...sky.retrogrades.map((b) => `astro.retrograde.${b}`),
  ];
}

/**
 * content_atoms keys for a natal chart, in display order:
 * astro.sun.<sign>, astro.moon.<sign>, astro.rising.<sign>, astro.<planet>.<sign>,
 * astro.<planet>.house.<n>, astro.aspect.<a>.<type>.<b>.
 */
export function atomKeysForAstro(chart: NatalChart): string[] {
  const keys: string[] = [
    `astro.sun.${chart.sun}`,
    `astro.moon.${chart.moon}`,
    `astro.rising.${chart.rising}`,
  ];
  for (const p of chart.planets) {
    if (p.body !== 'sun' && p.body !== 'moon') keys.push(`astro.${p.body}.${p.sign}`);
    if (p.retrograde && p.body !== 'northNode') keys.push(`astro.${p.body}.retrograde`);
  }
  for (const p of chart.planets) keys.push(`astro.${p.body}.house.${p.house}`);
  for (const a of chart.aspects) keys.push(`astro.aspect.${a.a}.${a.type}.${a.b}`);
  return Array.from(new Set(keys));
}

/** Wrap a chart in the shared engine envelope consumed by the reading composer. */
export function toEngineOutput(chart: NatalChart, confidence?: Confidence): ReadingEngineOutput<NatalChart> {
  const inferred: Confidence = confidence ?? (chart.warnings.length > 0 ? 'medium' : 'high');
  return {
    engine: ENGINE_ID,
    engineVersion: ENGINE_VERSION,
    facts: chart,
    atomKeys: atomKeysForAstro(chart),
    confidence: inferred,
    warnings: chart.warnings,
  };
}
