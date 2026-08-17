# 001 — Add subtle press feedback to Studio action buttons

- **Status**: TODO
- **Commit**: b4dcce5
- **Severity**: HIGH
- **Category**: Physicality & origin
- **Estimated scope**: 1 file, small size

## Problem

Action buttons in the Studio sidebar lack any active state scale feedback. Because there is no mechanical click feeling, users hit the button and have zero visual confirmation that the interface received their click until the content updates. This feels dead and hollow, especially for high-frequency configuration actions.

```tsx
/* src/app/studio/page.tsx:385 — current */
<button
  onClick={resetToDefaultSample}
  className="w-full flex items-center gap-2 py-2 px-3 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
>
```

## Target

Add tactile press feedback. The scale must be subtle (`0.97`) to avoid looking comical, and the duration must be tight (`160ms`) using a strong `ease-out`. 

We'll use Tailwind arbitrary values to ensure the exact values are respected without needing config changes, mapping directly to Emil Kowalski's guidelines.

```tsx
/* target */
<button
  onClick={resetToDefaultSample}
  className="w-full flex items-center gap-2 py-2 px-3 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
>
```

## Repo conventions to follow

The codebase currently uses standard Tailwind classes (`transition-colors`, `transition-all`). We will extend this convention by adding the specific duration and easing inline to guarantee the feeling isn't muted by standard defaults. 

## Steps

1. In `src/app/studio/page.tsx`, locate the six sidebar `<button>` elements starting around line 385.
2. For each button, change `transition-colors` to `transition-all`.
3. For each button, add the classes: `duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]`.
4. Apply the exact same changes to the primary "Download Print-Ready PDF" button around line 567. (It currently has `transition-all duration-150 active:scale-95`, which should be updated to match the `duration-[160ms]` and `ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]` for cohesion).

## Boundaries

- Do NOT touch the `onClick` handlers or other structural properties.
- Do NOT touch buttons outside of `src/app/studio/page.tsx` for this specific plan.
- Do NOT use Framer Motion; this is a pure CSS fix via Tailwind.

## Verification

- **Mechanical**: Run `npm run build` and ensure there are no compilation errors.
- **Feel check**: Run the UI, trigger a click on the sidebar buttons and confirm:
  - The button depresses slightly immediately upon mousedown.
  - Releasing the click springs the button back up using the custom cubic bezier curve.
  - The scale is subtle (not visibly shrinking to a tiny size like `scale-90` does).
- **Done when**: The visual feedback of pressing the button feels tactile and responsive.
