ScanShield — Smart Document Risk Checker
A powerful, neon-themed, client-side tool to scan documents and images for privacy risks (emails, phone numbers, IDs, addresses, URLs, keywords) with sanitization and export options. 100% free and offline.
Features

Upload and Scan: Drag-and-drop PDF, DOCX, TXT, PNG, JPG files.
Privacy Risk Detection: Detects emails, phone numbers, IDs, addresses, tracking URLs, and sensitive keywords.
Image Scanning: OCR via Tesseract.js for PNG/JPG.
Risk Analysis: Color-coded highlights (High, Medium, Low) with tooltips.
Sanitization: Split-view (Before/After) with redacted sensitive data.
Privacy Score: 0–100 score with detailed breakdown.
Metadata Checker: Extracts PDF metadata (author, creation date, etc.).
Offline Support: No server or APIs, fully client-side.
Export Options: TXT and PDF exports.
Neon Theme: Vibrant cyberpunk design with dark/light mode toggle.
Multi-Language: Supports English, Spanish, French patterns.
Scan Log: Detailed processing logs for debugging.

Deploy to GitHub Pages (No Git Required)

Save Files:

Create a folder named ScanShield.
Copy all files from this project into the folder, maintaining the structure (css/, js/, assets/fonts/, assets/icons/).


Download Dependencies (Optional, as CDN is used):

pdf.min.js: https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js
pdf.worker.min.js: https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js
mammoth.browser.min.js: https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js
tesseract.min.js: https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js
Place in js/ as a fallback (CDN is used by default).


Create GitHub Repository:

Go to https://github.com/new.
Name it ScanShield and create (public or private).


Upload Files:

In the repository, click "Add file" > "Upload files".
Drag and drop the ScanShield folder or upload files individually, preserving the structure.
Click "Commit changes".


Enable GitHub Pages:

Go to repository "Settings" > "Pages".
Set source to main branch and root folder (/).
Save. Wait a few minutes, then access at https://your-username.github.io/ScanShield.



Test Locally

Open index.html in a browser (e.g., Chrome).
If CDN fails, ensure js/ files are downloaded and present.

Dependencies

pdf.js: PDF parsing (CDN + local fallback).
mammoth.js: DOCX parsing (CDN + local fallback).
Tesseract.js: Image OCR (CDN + local fallback).
jsPDF: PDF export (CDN).
Tailwind CSS: Styling (CDN).
Orbitron Font: Neon typography (via assets/fonts/orbitron.css).

Troubleshooting

"pdfjsLib is not defined": Ensure internet connection for CDN or download pdf.min.js and pdf.worker.min.js to js/.
File Not Processing: Verify file type (PDF, DOCX, TXT, PNG, JPG) and size (<10MB recommended for images).
Theme Issues: Clear browser cache or hard refresh (Ctrl+F5).
Slow Image Scanning: OCR is resource-intensive; test with small images first.

Notes

Works offline after initial load (if local js/ files are used).
Image OCR may take seconds to minutes depending on file size and device.
For best neon effect, use a dark environment or dark mode.

License
MIT License
