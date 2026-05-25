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
- Confirm the plugin opens at 800x450.
- Confirm A/B/C/D tabs render.
- Confirm CanvasBadge displays 800x450 / 16:9.
- Confirm provider badges show demo mode.

## Message Bridge

- Send `INSERT_SVG` from UI code or future controls and confirm SVG insertion.
- Select one frame and send `REQUEST_SELECTED_FRAME`.
- Select two or more frames and send `REQUEST_SELECTED_FRAMES`.
- Confirm errors return as `PLUGIN_ERROR`.
- Confirm successful actions return as `PLUGIN_SUCCESS`.
