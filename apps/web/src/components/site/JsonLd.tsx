/** Inline JSON-LD. `data` is built server-side from engine output only (no user input), so serialising it is safe. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
