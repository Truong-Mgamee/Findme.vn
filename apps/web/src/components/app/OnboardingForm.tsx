'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, clientApi } from '@/lib/client-api';
import { searchCities, type City } from '@/lib/cities';
import { btn, input } from './ui';

type Labels = Record<'date' | 'time' | 'timeUnknown' | 'timeUnknownHint' | 'place' | 'placeHint' | 'gender' | 'male' | 'female' | 'other' | 'fullName' | 'citySearch' | 'noCity' | 'submit' | 'submitting' | 'selectCity' | 'error', string>;

/** Birth form → POST /profiles (isSelf). City list: apps/web/data/cities.json (apps/mobile/data/cities.json did not exist yet). */
export function OnboardingForm({ locale, defaultStandard, labels }: { locale: string; defaultStandard: string; labels: Labels }) {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [fullName, setFullName] = useState('');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState<City | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = useMemo(() => (city ? [] : searchCities(query)), [query, city]);

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!city) return setError(labels.selectCity);
        setBusy(true);
        setError(null);
        try {
          await clientApi('/profiles', {
            method: 'POST',
            headers: { 'x-locale': locale },
            json: {
              isSelf: true,
              ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
              birth: {
                date,
                ...(timeUnknown ? {} : { time }),
                timeUnknown,
                gender,
                place: { name: city.name, lat: city.lat, lng: city.lng, tz: city.tz, country: city.country },
                calendarStandard: city.country === 'VN' ? 'vn' : city.country === 'KR' ? 'kr' : city.country === 'JP' ? 'jp' : city.country === 'CN' || city.country === 'TW' || city.country === 'HK' ? 'cn' : defaultStandard,
              },
            },
          });
          router.push(`/${locale}/app`);
          router.refresh();
        } catch (err) {
          setError(err instanceof ApiError && typeof err.body?.message === 'string' ? String(err.body.message) : labels.error);
          setBusy(false);
        }
      }}
    >
      <label className="block text-sm">
        {labels.date}
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={`${input} mt-1`} max="2100-12-31" min="1900-01-01" />
      </label>
      <div>
        <label className="block text-sm">
          {labels.time}
          <input type="time" value={time} disabled={timeUnknown} required={!timeUnknown} onChange={(e) => setTime(e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} /> {labels.timeUnknown}
        </label>
        {timeUnknown && <p className="mt-1 text-xs text-white/60">{labels.timeUnknownHint}</p>}
      </div>
      <fieldset className="text-sm">
        <legend>{labels.gender}</legend>
        <div className="mt-1 flex gap-4">
          {(['female', 'male', 'other'] as const).map((g) => (
            <label key={g} className="flex items-center gap-1">
              <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} /> {labels[g]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="relative text-sm">
        <label className="block">
          {labels.place}
          <input
            type="text"
            value={city ? `${city.name} (${city.country})` : query}
            placeholder={labels.citySearch}
            onChange={(e) => {
              setCity(null);
              setQuery(e.target.value);
            }}
            className={`${input} mt-1`}
            autoComplete="off"
            aria-autocomplete="list"
          />
        </label>
        <p className="mt-1 text-xs text-white/60">{labels.placeHint}</p>
        {query && !city && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-white/20 bg-night-2 shadow-lg" role="listbox">
            {matches.length === 0 && <li className="px-3 py-2 text-white/60">{labels.noCity}</li>}
            {matches.map((c) => (
              <li key={`${c.name}-${c.country}`}>
                <button type="button" role="option" aria-selected={false} className="w-full px-3 py-2 text-left hover:bg-white/10" onClick={() => setCity(c)}>
                  {c.name} <span className="text-white/50">· {c.country} · {c.tz}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <label className="block text-sm">
        {labels.fullName}
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`${input} mt-1`} maxLength={120} />
      </label>
      {error && <p className="text-sm text-vermilion">{error}</p>}
      <button type="submit" className={btn} disabled={busy}>{busy ? labels.submitting : labels.submit}</button>
    </form>
  );
}
