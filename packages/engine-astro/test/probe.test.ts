import { it } from 'vitest';
import { ascendantAndMC, placidus, computeNatalChart, wholeSign, planetPositions, moonPhase, dailySky } from '../src/index.js';
it('probe', () => {
  const j = new Date('2000-01-01T12:00:00Z');
  console.log('London', ascendantAndMC(j, 51.5074, -0.1278));
  console.log('Placidus London', placidus(j, 51.5074, -0.1278).cusps.map((c) => c.toFixed(3)));
  console.log('Placidus eq', placidus(j, 0, 0).cusps.map((c) => c.toFixed(3)));
  const c = computeNatalChart({ utc: new Date('1997-12-24T05:00:00Z'), lat: 10.8231, lng: 106.6297 });
  console.log(JSON.stringify(c.angles), c.houses.map((x) => x.toFixed(2)), c.sun, c.moon, c.rising);
  console.log(c.aspects);
  console.log(c.planets.map((p) => `${p.body} ${p.lon.toFixed(2)} ${p.sign} H${p.house} ${p.retrograde ? 'R' : ''}`));
  console.log(placidus(j, 70, 20));
  console.log(dailySky(new Date('2024-04-10T12:00:00Z')));
});
