# Conventions & Design System Specification

## 1. Directory & File Structure
```
src/
├── app/                  # Application core
│   ├── App.vue           # Root component
│   ├── main.ts           # App bootstrap (pinia, router, i18n, pwa)
│   ├── router.ts         # Navigation routes
│   └── store.ts          # Global app state (locale, theme, persianDigits, sound)
├── core/                 # Simulation engine
│   ├── accumulator.ts    # Fixed-timestep physics loop decoupled from rendering
│   ├── prng.ts           # Seeded pseudorandom number generator (mulberry32)
│   ├── units.ts          # SI unit conversion, formatting, significant figures
│   └── constants.ts      # Standard physical & universal constants
├── db/                   # Persistence layer
│   └── index.ts          # Dexie schema (runs, slots, notes, settings, reports) & backup
├── experiments/          # Independent experiment plugins
│   ├── registry.ts       # Central catalog with lazy-loaded experiment loaders
│   └── <subject>/<topic>/<experiment-id>/
│       ├── config.ts     # Metadata, variables, presets, tools, formulas
│       ├── model/        # Pure TypeScript simulation model (no Vue/DOM)
│       ├── view/         # Renderer (Canvas 2D / Three.js 3D)
│       ├── ui/           # Experiment.vue (orchestrator + controls)
│       ├── i18n/         # fa.json & en.json
│       └── tests/        # model.spec.ts (Vitest unit tests)
├── shared/               # Reusable laboratory UI components
│   ├── UnitSlider.vue    # Range slider + exact numeric input + unit label + validation
│   ├── VariableGroup.vue # Collapsible accordion group of simulation parameters
│   ├── GraphPanel.vue    # High-performance uPlot chart (multi-run overlay, pan/zoom)
│   ├── DataTable.vue     # Dynamic data table with search, sort, and CSV export
│   ├── FormulaPanel.vue  # KaTeX-rendered formula card with live substituted values
│   ├── ToolWidgets/      # Measurement instruments (Ruler, Stopwatch, etc.)
│   ├── PresetPicker.vue  # Preset selection cards/dropdown
│   ├── SlotManager.vue   # Save/load/export/import state slots
│   ├── Toolbar.vue       # Play/pause/step/rewind/speed/Ideal-Real/reset/fullscreen
│   ├── GuidedSteps.vue   # Step-by-step interactive educational lab procedures
│   ├── Toast.vue         # Status & feedback notification toasts
│   ├── Modal.vue         # Accessible dialog overlay
│   ├── BottomSheet.vue   # Mobile/tablet draggable bottom sheet for controls
│   └── ExportReport.vue  # Persian-compatible HTML/Canvas PDF & print generator
├── styles/
│   ├── tokens.css        # CSS design tokens (colors, accents, radii, shadows, typography)
│   └── global.css        # Reset, logical layouts, Vazirmatn font-face, scrollbars
└── views/
    ├── HomeView.vue      # Subject/topic catalog, search, favorites, recent runs
    ├── ExperimentView.vue# Generic layout container loading experiment plugins
    └── SettingsView.vue  # App settings (language, theme, digits, storage management)
```

## 2. Experiment `config.ts` Schema
Every experiment exports a `defineExperimentConfig` object:
```ts
export interface ExperimentVariable {
  id: string;
  labelKey: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  descKey: string;
  realModeEffect: string | null;
}

export interface ExperimentPreset {
  id: string;
  labelKey: string;
  descKey?: string;
  params: Record<string, number>;
}

export interface ExperimentTool {
  id: string;
  nameKey: string;
  icon: string;
}

export interface ExperimentConfig {
  id: string; // e.g. 'physics/motion/projectile'
  subject: 'physics' | 'chemistry' | 'biology' | 'earth' | 'math' | 'engineering' | 'cs' | 'environment' | 'psychology' | 'astronomy' | 'economics';
  topic: string;
  titleKey: string;
  descKey: string;
  gradeTags: ('middle-school' | 'high-school' | 'university')[];
  difficulty: 'easy' | 'medium' | 'advanced';
  engine: 'canvas2d' | 'threejs';
  variables: ExperimentVariable[];
  presets: ExperimentPreset[];
  tools: ExperimentTool[];
  formulas: { titleKey: string; latex: string; explanationKey: string }[];
}
```

## 3. Design Tokens (`src/styles/tokens.css`)
- **Subject Accent Colors:**
  - `--color-physics`: `#3b82f6` (Blue)
  - `--color-chemistry`: `#10b981` (Emerald)
  - `--color-biology`: `#06b6d4` (Cyan)
  - `--color-earth`: `#f59e0b` (Amber)
  - `--color-math`: `#8b5cf6` (Purple)
  - `--color-engineering`: `#f97316` (Orange)
  - `--color-cs`: `#6366f1` (Indigo)
  - `--color-environment`: `#84cc16` (Lime)
  - `--color-psychology`: `#ec4899` (Pink)
  - `--color-astronomy`: `#38bdf8` (Sky)
  - `--color-economics`: `#14b8a6` (Teal)
- **Surfaces & Glass:**
  - Light mode: `--bg-primary: #f8fafc; --surface-card: rgba(255, 255, 255, 0.85); --glass-border: rgba(226, 232, 240, 0.8);`
  - Dark mode: `--bg-primary: #0f172a; --surface-card: rgba(30, 41, 59, 0.85); --glass-border: rgba(51, 65, 85, 0.8);`
- **Typography & Motion:**
  - `--font-sans: 'Vazirmatn', system-ui, -apple-system, sans-serif;`
  - `--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);`
  - `--transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);`

## 4. Internationalization (i18n) & Bidi
- Default language: `fa` (RTL). Secondary: `en` (LTR).
- All labels and strings in UI must use `$t('experiment.key')`.
- Numbers formatted via `formatNumber(value, locale, digitsPreference)`.
- Units and math blocks must use `<span class="ltr"><bdi>...` to ensure proper visual direction regardless of parent RTL document.
