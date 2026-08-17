# SEO Action Plan: Labellr
**Target Domain:** https://lebellr.systemiq.in

## 🔴 High Priority / Critical (Do This Week)

1. **Implement `SoftwareApplication` Schema**
   - **Action**: Inject JSON-LD schema into `src/app/layout.tsx` to explicitly tell Google this is a browser-based label design tool.
   - **Effort**: Low

2. **Semantic Restructuring / Landing Page**
   - **Action**: The main page (`/`) is currently a full-screen app. Search engine bots will see very little readable content. Either build a dedicated SEO landing page at `/` (and move the app to `/app`), OR add a visually clean, text-rich footer to the app describing its features.
   - **Effort**: High

## ⚠️ Medium Priority (Optimization)

3. **Lazy Load Heavy Libraries**
   - **Action**: Dynamically import `jspdf` and `qrcode` so they don't block the initial page render. This will drastically improve LCP and INP scores.
   - **Effort**: Medium

4. **Enhance On-Page Typography Hierarchy**
   - **Action**: Ensure the main header uses an SEO-friendly `<h1>` like "Labellr: Free Industrial Label Generator", rather than just "Labellr Studio".
   - **Effort**: Low
