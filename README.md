# ScanShield — Smart Document Risk Checker

Protect your privacy before you share documents. Instantly scan for emails, phone numbers, IDs, and hidden metadata — 100% free and offline.

## Features

- **Upload and Scan**: Drag-and-drop or click to upload PDF, DOCX, or TXT files.
- **Privacy Risk Detection**: Detects emails, phone numbers, national IDs, addresses, tracking URLs, and sensitive keywords.
- **Risk Analysis**: Color-coded highlights (High, Medium, Low risk) with tooltips.
- **Sanitization**: Remove or replace risky information with a split-view (Before/After).
- **Privacy Score**: 0–100 score with breakdown of findings.
- **Metadata Checker**: Extracts author, creation date, etc., from PDFs.
- **Offline Support**: No server or cloud APIs, 100% client-side.
- **Export Options**: Save sanitized content as TXT or PDF.
- **Responsive Design**: Mobile-first with dark/light mode toggle.

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ScanShield.git
   ```
2. Navigate to the project folder:
   ```bash
   cd ScanShield
   ```
3. Open `index.html` in a browser or deploy to GitHub Pages.

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. Go to the repository settings on GitHub.
3. Scroll to the "GitHub Pages" section.
4. Set the source to the `main` branch and root folder.
5. Access the deployed site at `https://your-username.github.io/ScanShield`.

## Dependencies

- **pdf.js**: For PDF parsing (included in `js/pdf.min.js` and `js/pdf.worker.min.js`).
- **mammoth.js**: For DOCX parsing (included in `js/mammoth.browser.min.js`).
- **Tailwind CSS**: For styling (via CDN in `css/style.css`).
- **Inter Font**: For typography (via `assets/fonts/inter.css`).

## Notes

- Ensure `js/pdf.min.js`, `js/pdf.worker.min.js`, and `js/mammoth.browser.min.js` are downloaded from their respective sources and placed in the `js/` folder.
- The project is designed to work offline after the initial load, with all assets stored locally.

## License

MIT License