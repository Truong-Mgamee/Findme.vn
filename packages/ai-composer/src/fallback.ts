import type { Locale } from '@findme/engine-core';
import type { Atom, ReadingOutput } from './schema.js';

const DISCLAIMER: Partial<Record<Locale, string>> = {
  vi: 'Nội dung mang tính chiêm nghiệm và gợi mở, không thay thế tư vấn y tế, pháp lý hay tài chính.',
  en: 'This reading is for reflection and inspiration; it is not medical, legal or financial advice.',
};

/** Deterministic reading assembled from atoms only — used when the model output fails validation twice. */
export function templateReading(atoms: Atom[], locale: Locale, summary?: string): ReadingOutput {
  const sections = atoms.slice(0, 8).map((a) => ({ title: a.title ?? a.key, body: a.body, atomRefs: [a.key] }));
  return {
    summary: summary ?? (sections[0]?.body.split(/(?<=[.!?。])\s/)[0] ?? ''),
    sections: sections.length ? sections : [{ title: 'Overview', body: locale === 'vi' ? 'Chưa đủ dữ liệu luận giải.' : 'Not enough data to interpret.', atomRefs: [] }],
    actions: [],
    caveats: [locale === 'vi' ? 'Bản luận giải rút gọn từ kho nội dung đã duyệt.' : 'Condensed reading assembled from reviewed content.'],
    disclaimer: DISCLAIMER[locale] ?? DISCLAIMER.en!,
  };
}
