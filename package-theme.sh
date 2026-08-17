#!/usr/bin/env bash
# Packages this theme into a ZIP with assets/, config/, layout/, locales/,
# sections/, snippets/, templates/ at the ZIP ROOT (not nested inside a
# wrapper folder). Shopify Admin's "Upload zip file" flow requires the
# theme folders at the archive root — if you instead zip the folder itself
# (e.g. via "Download ZIP" on GitHub, or right-click > Compress on macOS/
# Windows), everything ends up nested one level deep, the upload can still
# "succeed" but template routing breaks, and the homepage (or any route)
# renders the theme's own 404 page.
#
# Usage: ./package-theme.sh [output.zip]

set -euo pipefail
cd "$(dirname "$0")"

OUTPUT="${1:-vyro-theme.zip}"
rm -f "$OUTPUT"

zip -r "$OUTPUT" \
  assets config layout locales sections snippets templates \
  -x "*.DS_Store" "*/.DS_Store"

echo "Created $OUTPUT"
echo "Verify the theme folders sit at the zip root:"
unzip -l "$OUTPUT" | head -15
