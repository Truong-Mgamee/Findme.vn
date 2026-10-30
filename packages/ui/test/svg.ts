import { screen } from '@testing-library/react-native';

type Json = { type?: string; props?: Record<string, unknown>; children?: Json[] | null } | string | null;

/** react-native-svg puts <Text> content on `RNSVGTSpan.props.content`, not as children → collect it for assertions. */
export function svgTexts(): string[] {
  const out: string[] = [];
  const walk = (n: Json | Json[] | undefined) => {
    if (!n) return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (typeof n === 'string') return;
    const c = n.props?.content;
    if (typeof c === 'string') out.push(c);
    if (n.children) walk(n.children);
  };
  walk(screen.toJSON() as Json | Json[]);
  return out;
}
