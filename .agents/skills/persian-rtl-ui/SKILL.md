---
name: persian-rtl-ui
description: Handles Persian (fa) RTL layout, vue-i18n translations, Persian typography, digits, and mixed LTR math/formula rendering. Use for any UI text, layout, or localization work.
---

# Persian RTL UI

## Rules
- Default locale `fa` (dir=rtl), secondary `en` (dir=ltr). Set `<html lang dir>` reactively.
- Use CSS logical properties only (`padding-inline`, `margin-inline-start`, `inset-inline-end`, `text-align: start`).
- Never hardcode user-visible strings; use i18n keys `<experiment>.<key>`. Provide both fa and en.
- Bundle a Persian font locally (e.g. Vazirmatn) — no CDN.
- Digit setting: Latin / Persian. Format with `Intl.NumberFormat('fa-IR')` when Persian digits enabled; keep decimal separator consistent.
- Formulas, units, and chemical formulas are LTR islands: wrap in `<bdi dir="ltr">` or a `.ltr` class. Render math with KaTeX (bundled).
- Charts: axes/legend text localized; numeric axes LTR; mirror layout of toolbars but not of graphs/time axes.
- Physical direction matters (e.g., left/right motion, circuit polarity): do NOT mirror scene canvases.
- Icons with direction (arrows, back) must flip in RTL; others must not.

## Check before finishing
Switch fa↔en and verify no overflow, no mixed-direction glitches, correct number formatting, tooltips and dialogs aligned.
