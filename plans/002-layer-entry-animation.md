# 002 — Enter animation for Layers Manager list items

- **Status**: TODO
- **Commit**: b4dcce5
- **Severity**: HIGH
- **Category**: Interruptibility & Purpose
- **Estimated scope**: 1 file, small size

## Problem

When a new layer is added in the Studio, it teleports instantly into the Layers Manager list. This instant jump is jarring and breaks the spatial mapping of the interface. Since adding a layer changes the structural stack of the document, a subtle enter animation is required to prevent visual discontinuity.

```tsx
/* src/components/layers-manager.tsx:221 — current */
{layers.map((layer, index) => {
  return (
    <div 
      key={layer.id}
      className={`relative flex flex-col gap-2 rounded-lg border...`}
```

## Target

Animate the entry of the list items. Since they enter dynamically, we must use `@starting-style` logic (via Tailwind's standard transition utilities and mounting logic) or just simple entrance keyframes. Since it's a dynamic list, an `@keyframes` entrance is robust and doesn't require Framer Motion or JS orchestration.

```css
/* target css in globals.css or inline */
@keyframes enter-layer {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
.animate-enter-layer {
  animation: enter-layer 250ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
}
```

Since we are using Tailwind v4, we can define it inline via arbitrary properties or directly add the `@keyframes` to `globals.css` and map it.

```tsx
/* target element */
<div 
  key={layer.id}
  className={`relative flex flex-col gap-2 rounded-lg border animate-[enter-layer_250ms_cubic-bezier(0.23,1,0.32,1)_forwards] ...`}
>
```

## Repo conventions to follow

The repository heavily relies on Tailwind utility classes. For one-off entrance animations, defining a custom `@keyframes` in `src/app/globals.css` and invoking it with Tailwind's `animate-[...]` class is the preferred zero-dependency pattern.

## Steps

1. Open `src/app/globals.css`.
2. Append the following `@keyframes` at the bottom of the file:
```css
@keyframes enter-layer {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
```
3. Open `src/components/layers-manager.tsx`.
4. Locate the mapped `<div>` for `layers.map` at line 223.
5. Add `animate-[enter-layer_250ms_cubic-bezier(0.23,1,0.32,1)_forwards]` to its `className`.

## Boundaries

- Do NOT install Framer Motion or React Spring.
- Do NOT convert the component to use JS-based entry transitions.
- Do NOT touch the exit transitions (the scope is strictly the enter animation for now).

## Verification

- **Mechanical**: Run `npm run build` and ensure there are no compilation errors.
- **Feel check**: Add a new layer via the UI buttons (e.g., "Add Text"). Confirm:
  - The newly added layer item in the list gently fades in and scales up from `0.95` to `1`.
  - The animation does not look sluggish (should take exactly 250ms).
- **Done when**: Adding a layer feels smooth and fluid instead of instantly teleporting.
