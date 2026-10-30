import type { BirthInput } from '@findme/engine-core';

/** Deterministic self profile used by all UI tests (Hà Nội, VN standard). */
export const BIRTH: BirthInput = {
  date: '1990-06-15',
  time: '08:30',
  timeUnknown: false,
  gender: 'female',
  place: { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, tz: 'Asia/Ho_Chi_Minh', country: 'VN' },
  calendarStandard: 'vn',
};

export const BIRTH_NO_TIME: BirthInput = { ...BIRTH, time: undefined, timeUnknown: true };
