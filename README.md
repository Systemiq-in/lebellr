# Labellr Design Studio & Printing Engine

An industrial-grade, client-side label design studio and high-fidelity print generation workbench. Labellr enables organizations to map inventory databases, design pixel-perfect physical sticker sheets, and compile print-ready PDFs entirely in the browser with zero server overhead and complete data privacy.

---

## Key Features

- **High-Performance Preview Canvas**: 
  - Switch seamlessly between **Focused Card** mode (single card focus for lag-free, high-speed layout design) and **Full Sheet Grid** mode (full physical A4/thermal sheets with interactive selection).
- **Resilient Logical Data Mappings**:
  - Map dynamic labels to logical schemas (`sku`, `title`, `price`, `promoPrice`, `quantity`, `ingredients`, `expiry`, `zone`) to maintain layout stability across diverse inventory Excel/CSV uploads.
- **Smart Compliance Block Text Scaling**:
  - Dynamically computes and scales warning text/ingredients blocks on the fly using a canvas-level measurements cache, ensuring copy fits perfectly within boundary constraints without DOM thrashing.
- **Vector-Level Barcode & QR Code Engine**:
  - On-the-fly vector rendering for `Code 128`, `EAN-13`, `UPC-A`, and `QR Code` formats with real-time format validation.
- **GHS Safety Symbol Mapping**:
  - Automatically dynamically displays Globally Harmonized System (GHS) warning symbols based on safety indicators in your spreadsheet.
- **Dynamic Styling & Accent Bands**:
  - Set border colors dynamically using rules mapped to specific column values (e.g. green for "In Stock", orange for "Hazardous").
- **Physical Grid Presets**:
  - Preloaded with Avery standard sheets, custom matrices, and high-density industrial thermal sticker sheets.

---

## Tech Stack & Architecture

- **Framework**: [Next.js](https://nextjs.org/) (App Router architecture).
- **Styling**: Tailwind CSS with a curated, high-contrast professional dark-mode / minimalist theme.
- **Spreadsheet Parsers**: PapaParse (CSV) & SheetJS/xlsx (Excel).
- **Barcode & QR Engines**: Customized vector renderers & QRCode.js.
- **Print Engine**: jspdf (Client-side PDF compiler).

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm / yarn / pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com MuhammadRamzy/labellr.git
   cd labellr
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build and Deploy

To create a optimized production build:
```bash
npm run build
npm run start
```

---

## Repository Setup & Contribution

To push to the remote repository:

```bash
git remote add origin https://github.com/MuhammadRamzy/labellr.git
git branch -M main
git push -u origin main
```
