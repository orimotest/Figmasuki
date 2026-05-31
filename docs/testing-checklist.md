# Testing Checklist

## TypeScript

- Run `npm run typecheck`.
- Confirm workflow return types match schema definitions.
- Confirm provider index remains the only workflow-facing provider entrypoint.

## Build

- Run `npm run build`.
- Confirm `dist/code.js` is generated for the Figma plugin main script.
- Confirm UI assets are generated under `dist/`.

## Figma Plugin Basics

- Import `manifest.json` in Figma as a development plugin.
- Confirm the plugin opens in the taller default panel.
- Confirm 要件入力 / 自動制作 / 診断 / 比較 / 仕上げ / Figma出力 sidebar items render in that order.
- Confirm the settings icon opens the left API settings drawer and Esc closes it.
- Confirm Fit / Work / Review resize presets change the plugin window size.
- Confirm CanvasBadge displays 800x450 / 16:9.
- Confirm Demo / API mode can be switched in Settings and no prominent Demo Mode badge appears in the header.

## Message Bridge

- Send `INSERT_SVG` from UI code or future controls and confirm SVG insertion.
- Select one frame and send `REQUEST_SELECTED_FRAME`.
- Select two or more frames and send `REQUEST_SELECTED_FRAMES`.
- Confirm errors return as `PLUGIN_ERROR`.
- Confirm successful actions return as `PLUGIN_SUCCESS`.
