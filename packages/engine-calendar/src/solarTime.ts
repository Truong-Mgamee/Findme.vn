/**
 * Equation of time (minutes) — Spencer (1971) Fourier series, accuracy ≈ ±0.5 min.
 * Positive means apparent solar time is AHEAD of mean solar time.
 */
export function equationOfTimeMinutes(utc: Date): number {
  const start = Date.UTC(utc.getUTCFullYear(), 0, 1);
  const dayOfYear = (utc.getTime() - start) / 86400000; // fractional, 0-based
  const b = (2 * Math.PI * dayOfYear) / 365.2422;
  return (
    229.18 *
    (0.000075 + 0.001868 * Math.cos(b) - 0.032077 * Math.sin(b) - 0.014615 * Math.cos(2 * b) - 0.040849 * Math.sin(2 * b))
  );
}

/**
 * Minutes to add to zone civil time to get apparent (true) solar time at `lng`.
 * = longitude correction (4 min per degree from the zone's standard meridian) + equation of time.
 */
export function trueSolarOffsetMinutes(utc: Date, lng: number, zoneOffsetMinutes: number): number {
  const standardMeridian = zoneOffsetMinutes / 4; // 60 min = 15°
  const longitudeCorrection = 4 * (lng - standardMeridian);
  return longitudeCorrection + equationOfTimeMinutes(utc);
}
