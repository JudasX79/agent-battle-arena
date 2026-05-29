#!/usr/bin/env bash
# Regenerate public/og.png (1200x630) from public/og.svg using macOS QuickLook.
# QuickLook normalizes SVGs to a square, so og.svg is authored as 1200x1200 with
# the banner centered; we render the square then center-crop to 1200x630.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/public"
TMP="$(mktemp -d)"
qlmanage -t -s 1200 -o "$TMP" "$DIR/og.svg" >/dev/null 2>&1
sips -c 630 1200 "$TMP/og.svg.png" --out "$DIR/og.png" >/dev/null
echo "wrote $DIR/og.png ($(sips -g pixelWidth -g pixelHeight "$DIR/og.png" | grep -o '[0-9]*' | tr '\n' 'x' | sed 's/x$//'))"
rm -rf "$TMP"
