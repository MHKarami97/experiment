---
name: ui-design-system
description: Defines and applies the visual design system (tokens, themes, shared components, layout, motion) so all experiments look consistent and polished. Use when building UI, shared components, themes, or layouts.
---

# UI design system

## Tokens (`src/styles/tokens.css`)
Colors (primary, surface, text, success, warning, danger, plus per-subject accents: physics blue, chemistry green, biology teal, earth amber, math purple), spacing scale (4px base), radii, shadows, typography scale, motion durations. Light and dark sets via `[data-theme]`.

## Layout
- Home: subject grid > topic > experiment cards (thumbnail, difficulty, grade tags, favorite star, search).
- Experiment page: central scene, right/left control panel (RTL-aware), bottom tabs (Graph, Table, Notes, Theory), top toolbar (play, step, reset, speed, mode, save, export, fullscreen).
- Mobile: bottom sheet for controls; scene stays visible.

## Shared components (`src/shared/`)
UnitSlider (slider + numeric input + unit + validation) · VariableGroup · GraphPanel · DataTable · ToolWidgets (ruler, stopwatch, voltmeter, balance, thermometer) · FormulaPanel · PresetPicker · SlotManager · Toast · Modal · GuidedSteps.

## Style rules
- Glass/soft-card look with subtle shadows, smooth 150–250ms transitions, respect `prefers-reduced-motion`.
- Scene visuals should look realistic: gradients, shadows, textured materials in Three.js, labeled instruments, accurate scale bars.
- Contrast ≥ WCAG AA. Focus rings visible. Min touch target 44px.
- No inline magic colors/sizes; always use tokens.
- Verify visually with Playwright screenshots in light/dark and fa/en.
