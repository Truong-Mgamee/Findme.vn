/** Tailwind classes map to packages/ui tokens so NativeWind + StyleSheet stay in sync. */
const dark = { bg: '#0B1020', surface: '#141B2E', surfaceAlt: '#1C2440', border: '#2A3356', text: '#F2F4FA', muted: '#9AA3C0', primary: '#E7C56A', onPrimary: '#1A1400', accent: '#8B7CF6', success: '#4ADE80', warning: '#FBBF24', danger: '#F87171' };
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: dark,
      borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '24px' },
      minHeight: { touch: '44px' },
    },
  },
  plugins: [],
};
