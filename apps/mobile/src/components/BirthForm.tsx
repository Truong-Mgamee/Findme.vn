/**
 * Birth input (S1) shared by onboarding and "add partner": date/time pickers, "I don't know my time",
 * gender, place search over the bundled city list. Emits a BirthInput ready for POST /v1/profiles.
 */
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import type { BirthInput, CalendarStandard, Gender } from '@findme/engine-core';
import { defaultCalendarStandard } from '@findme/i18n';
import { Button, Card, Chip, Row, Text, useTheme } from '@findme/ui';
import { searchCities, type City } from '../lib/cities';
import { fmtDate } from '../lib/format';
import { useSession } from '../store/session';

export interface BirthFormValue {
  birth: BirthInput;
  fullName?: string;
  label?: string;
}

export interface BirthFormProps {
  initial?: Partial<BirthFormValue>;
  submitLabel: string;
  askName?: boolean;
  askLabel?: boolean;
  busy?: boolean;
  onSubmit: (v: BirthFormValue) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toHHmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function BirthForm({ initial, submitLabel, askName, askLabel, busy, onSubmit }: BirthFormProps) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const uiLocale = useSession((s) => s.uiLocale);
  const user = useSession((s) => s.user);
  const [date, setDate] = useState<Date>(initial?.birth?.date ? new Date(`${initial.birth.date}T12:00:00`) : new Date(1995, 0, 1, 12));
  const [time, setTime] = useState<Date>(initial?.birth?.time ? new Date(`2000-01-01T${initial.birth.time}:00`) : new Date(2000, 0, 1, 8, 0));
  const [timeUnknown, setTimeUnknown] = useState<boolean>(initial?.birth?.timeUnknown ?? false);
  const [gender, setGender] = useState<Gender>(initial?.birth?.gender ?? 'female');
  const [city, setCity] = useState<City | null>(initial?.birth?.place ? { name: initial.birth.place.name, lat: initial.birth.place.lat, lng: initial.birth.place.lng, tz: initial.birth.place.tz ?? 'UTC', country: initial.birth.place.country ?? '' } : null);
  const [query, setQuery] = useState('');
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [showDate, setShowDate] = useState(Platform.OS === 'ios');
  const [showTime, setShowTime] = useState(Platform.OS === 'ios');
  const [webDate, setWebDate] = useState(toISODate(date));
  const [webTime, setWebTime] = useState(toHHmm(time));

  const results = useMemo(() => searchCities(query, { limit: 6, country: user?.country ?? undefined }), [query, user?.country]);
  const calendarStandard: CalendarStandard = user?.calendarStandard ?? defaultCalendarStandard(city?.country);
  const valid = !!city && (timeUnknown || !!time);

  const submit = () => {
    if (!city) return;
    const d = Platform.OS === 'web' ? webDate : toISODate(date);
    const tm = Platform.OS === 'web' ? webTime : toHHmm(time);
    onSubmit({
      birth: { date: d, time: timeUnknown ? undefined : tm, timeUnknown, gender, place: { name: city.name, lat: city.lat, lng: city.lng, tz: city.tz, country: city.country }, useTrueSolarTime: true, calendarStandard },
      fullName: fullName.trim() || undefined,
      label: label.trim() || undefined,
    });
  };

  const onDate = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS !== 'ios') setShowDate(false);
    if (d) setDate(d);
  };
  const onTime = (_: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS !== 'ios') setShowTime(false);
    if (d) setTime(d);
  };

  const inputStyle = { borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radii.md, padding: t.spacing[3], color: t.colors.text, minHeight: t.touchTarget, backgroundColor: t.colors.surface, fontSize: 16 * t.fontScale } as const;

  return (
    <View>
      {askLabel ? (
        <Card style={{ marginBottom: t.spacing[3] }}>
          <Text size="sm" color="muted">
            {tr('profiles.labelField')}
          </Text>
          <TextInput value={label} onChangeText={setLabel} placeholder={tr('profiles.labelPlaceholder')} placeholderTextColor={t.colors.textMuted} style={inputStyle} accessibilityLabel={tr('profiles.labelField')} testID="birth-label" />
        </Card>
      ) : null}
      <Card style={{ marginBottom: t.spacing[3] }}>
        <Text size="sm" color="muted">
          {tr('onboarding.birth.date')}
        </Text>
        {Platform.OS === 'web' ? (
          <TextInput value={webDate} onChangeText={setWebDate} placeholder="YYYY-MM-DD" placeholderTextColor={t.colors.textMuted} style={inputStyle} accessibilityLabel={tr('onboarding.birth.date')} testID="birth-date" />
        ) : (
          <>
            <Pressable onPress={() => setShowDate(true)} accessibilityRole="button" accessibilityLabel={`${tr('onboarding.birth.date')}: ${fmtDate(date, uiLocale)}`} testID="birth-date" style={{ minHeight: t.touchTarget, justifyContent: 'center' }}>
              <Text size="lg" weight="semibold">
                {fmtDate(date, uiLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </Pressable>
            {showDate ? <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} maximumDate={new Date()} onChange={onDate} locale={uiLocale} /> : null}
          </>
        )}
      </Card>
      <Card style={{ marginBottom: t.spacing[3] }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text size="sm" color="muted">
            {tr('onboarding.birth.time')}
          </Text>
          <Chip label={tr('onboarding.birth.timeUnknown')} tone={timeUnknown ? 'selected' : 'neutral'} onPress={() => setTimeUnknown((v) => !v)} testID="birth-time-unknown" />
        </Row>
        {timeUnknown ? (
          <Text size="xs" color="warning">
            {tr('onboarding.birth.timeUnknownHint')}
          </Text>
        ) : Platform.OS === 'web' ? (
          <TextInput value={webTime} onChangeText={setWebTime} placeholder="HH:mm" placeholderTextColor={t.colors.textMuted} style={inputStyle} accessibilityLabel={tr('onboarding.birth.time')} testID="birth-time" />
        ) : (
          <>
            <Pressable onPress={() => setShowTime(true)} accessibilityRole="button" accessibilityLabel={`${tr('onboarding.birth.time')}: ${toHHmm(time)}`} testID="birth-time" style={{ minHeight: t.touchTarget, justifyContent: 'center' }}>
              <Text size="lg" weight="semibold">
                {toHHmm(time)}
              </Text>
            </Pressable>
            {showTime ? <DateTimePicker value={time} mode="time" is24Hour display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTime} /> : null}
          </>
        )}
      </Card>
      <Card style={{ marginBottom: t.spacing[3] }}>
        <Text size="sm" color="muted" style={{ marginBottom: t.spacing[2] }}>
          {tr('onboarding.birth.gender')}
        </Text>
        <Row accessibilityRole="radiogroup">
          {(['female', 'male', 'other'] as Gender[]).map((g) => (
            <Chip key={g} label={tr(`onboarding.birth.genders.${g}`)} tone={gender === g ? 'selected' : 'neutral'} onPress={() => setGender(g)} testID={`gender-${g}`} />
          ))}
        </Row>
      </Card>
      <Card style={{ marginBottom: t.spacing[3] }}>
        <Text size="sm" color="muted">
          {tr('onboarding.birth.place')}
        </Text>
        {city ? (
          <Row style={{ justifyContent: 'space-between', marginTop: t.spacing[1] }}>
            <View style={{ flex: 1 }}>
              <Text size="lg" weight="semibold" testID="birth-place-selected">
                {city.name}
              </Text>
              <Text size="xs" color="muted">
                {city.country} · {city.tz}
              </Text>
            </View>
            <Button label={tr('common.change')} variant="ghost" onPress={() => setCity(null)} />
          </Row>
        ) : (
          <>
            <TextInput value={query} onChangeText={setQuery} placeholder={tr('onboarding.birth.placePlaceholder')} placeholderTextColor={t.colors.textMuted} autoCorrect={false} style={[inputStyle, { marginTop: t.spacing[1] }]} accessibilityLabel={tr('onboarding.birth.place')} testID="birth-place" />
            <View accessibilityRole="list">
              {results.map((c) => (
                <Pressable key={`${c.name}|${c.country}`} onPress={() => setCity(c)} accessibilityRole="button" accessibilityLabel={`${c.name}, ${c.country}`} testID={`city-${c.country}-${c.name}`} style={{ minHeight: t.touchTarget, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: t.colors.border }}>
                  <Text size="md">
                    {c.name} <Text size="sm" color="muted">{c.country}</Text>
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        <Text size="xs" color="muted" style={{ marginTop: t.spacing[2] }}>
          {tr('onboarding.birth.placeHint')}
        </Text>
      </Card>
      {askName ? (
        <Card style={{ marginBottom: t.spacing[3] }}>
          <Text size="sm" color="muted">
            {tr('onboarding.birth.fullName')}
          </Text>
          <TextInput value={fullName} onChangeText={setFullName} placeholder={tr('onboarding.birth.fullNamePlaceholder')} placeholderTextColor={t.colors.textMuted} style={inputStyle} accessibilityLabel={tr('onboarding.birth.fullName')} testID="birth-name" />
          <Text size="xs" color="muted" style={{ marginTop: t.spacing[1] }}>
            {tr('onboarding.birth.fullNameHint')}
          </Text>
        </Card>
      ) : null}
      <Button label={submitLabel} size="lg" onPress={submit} disabled={!valid} loading={busy} testID="birth-submit" />
    </View>
  );
}
