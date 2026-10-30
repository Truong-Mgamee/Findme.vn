#!/usr/bin/env bash
# Build the web app as a static bundle that can be hosted anywhere (claude.ai Artifact, Vercel, S3, nginx).
# Output: dist-web/ with page.html (fragment for the Artifact service), index.html (full page), js/app.js, assets/, favicon.ico
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/dist-web}"
pnpm --filter @fortune/engine build >/dev/null
pnpm --filter @fortune/content build >/dev/null
rm -rf "$OUT" && mkdir -p "$OUT"
(cd "$ROOT/apps/mobile" && npx expo export -p web --output-dir "$OUT" >/dev/null)
mkdir -p "$OUT/js"
mv "$OUT"/_expo/static/js/web/*.js "$OUT/js/app.js" && rm -rf "$OUT/_expo"
sed -i 's|"/assets/__node_modules|"assets/__node_modules|g' "$OUT/js/app.js"
sed -i 's|src="/_expo/static/js/web/[^"]*"|src="js/app.js"|; s|href="/favicon.ico"|href="favicon.ico"|' "$OUT/index.html"
# fragment for hosts that wrap the page in their own <html> skeleton
cat > "$OUT/page.html" <<HTML
<title>Daily Fate</title>
<style>
  :root { --bg: #0F0E17; --fg: #FFFFFE; color-scheme: dark; }
  html, body { height: 100%; }
  body { margin: 0; overflow: hidden; background: var(--bg); color: var(--fg); }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<link rel="icon" href="favicon.ico">
<noscript>You need to enable JavaScript to run this app.</noscript>
<div id="root"></div>
<script>
  try { if (location.pathname !== "/" && !/\/(today|profile|calendar|settings|onboarding)$/.test(location.pathname)) { history.replaceState(null, "", "/" + location.search + location.hash); } } catch (e) {}
</script>
<script src="js/app.js" defer></script>
HTML
echo "web bundle at $OUT ($(du -sh "$OUT" | cut -f1))"
