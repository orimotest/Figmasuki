# Implementation Plan

## Purpose

This Figma plugin is an AI-assisted creative workflow tool for producing, checking, comparing, and finishing editable 800x450 layout assets. The MVP keeps the canvas fixed to a 16:9 frame so every workflow can share one predictable target size.

## Workflow Responsibilities

### A. Explore / Generate Layout

Explore input text, copy direction, layout direction, and visual tone. The intended live flow is Dify for language exploration and Gemini for SVG layout generation. The plugin inserts SVG layout candidates into Figma.

### B. Diagnose

Analyze a selected frame. The first layer is rule-based checks, followed later by Dify-generated diagnostic comments using content-type presets.

### C. Compare / Decide

Compare multiple selected frames, identify primary and secondary candidates, and prepare a background-generation brief for the selected base candidate.

### D. Finish / Background

Generate or apply a background only to the selected final candidate. Text and CTA layers should remain editable above a replaceable background layer.

## Provider Structure

UI and workflow code call `src/providers/index.ts` instead of importing demo, Dify, or Gemini implementations directly. This keeps provider switching centralized and makes it possible to replace demo stubs with live clients or backend calls later.

Initial provider modes are all `demo` in `src/config/providers.ts`:

- copy
- layout
- svg
- diagnosis
- compare
- background

## Why Demo Mode Matters

Demo mode lets the product workflow be developed and tested without API keys, network availability, or billing risk. It also gives UI and Figma plugin integration a stable fixture set before live provider behavior becomes variable.

## Suggested Implementation Order

1. Complete the A / Explore demo experience with five directions and SVG insertion.
2. Implement B / Diagnose rule checks using selected-frame extraction.
3. Add C / Compare scoring on multiple selected frames.
4. Add D / Finish background layer replacement behind editable text.
5. Introduce Dify and Gemini live providers behind the existing provider index.
6. Move sensitive API execution to a backend once the live workflow stabilizes.

## API Key Policy

Direct API-key testing is acceptable during local validation, but keys must stay in provider or environment configuration files. React components should never contain API keys, provider credentials, or direct live API calls.

See `docs/live-provider-setup.md` for Dify/Gemini setup, fallback behavior, and backend migration notes.
