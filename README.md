ScanShield — Smart Document Risk Checker
A professional, client-side tool to scan documents and images for privacy risks (emails, phone numbers, IDs, addresses, URLs, keywords) with sanitization and export options. 100% free and offline.
Features

Upload and Scan: Drag-and-drop PDF, DOCX, TXT, PNG, JPG.
Privacy Risk Detection: Detects emails, phone numbers, IDs, addresses, URLs, keywords.
Image Scanning: OCR via Tesseract.js for PNG/JPG.
Risk Analysis: Color-coded highlights (High, Medium, Low) with tooltips.
Sanitization: Split-view (Before/After) with redacted data.
Privacy Score: 0–100 score with breakdown.
Metadata Checker: Extracts PDF metadata (author, creation date, etc.).
Offline Support: No server or APIs.
Export Options: TXT and PDF exports.
Professional Theme: Clean blue/white/gray design with dark/light mode.
Multi-Language: English, Spanish, French patterns.
Scan Log: Detailed processing logs.

Deploy to GitHub Pages (No Git)

Save Files:
Create a ScanShield folder.
Copy all files into the correct structure (css/, js/, assets/fonts/, assets/icons/).


Download Dependencies (Optional, CDN used):
pdf.min.js: https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js
pdfámí.worker.min.js: https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js
mammoth.browser.min.js: https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js
tesseract.min.js: https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js
Place in js/ as fallback.


Create Repository:
Go to https://github.com/new, name it ScanShield.


Upload Files:
Click "Add file" > "Upload files".
Drag and drop ScanShield folder or upload individually.
Commit changes.


Enable GitHub Pages:
Go to "Settings" > "Pages".
Set source to main branch, root folder (/).
Save. Access at https://your-username.github.io/ScanShield.



Test Locally

Open index.html in a browser.
Ensure internet for CDN or download js/ files.

Dependencies

pdf.js: PDF parsing (CDN + fallback).
mammoth.js: DOCX parsing (CDN + fallback).
Tesseract.js: Image OCR (CDN + fallback).
jsPDF: PDF export (CDN).
Tailwind CSS: Styling (CDN).
Inter Font: Typography (assets/fonts/inter.css).

Troubleshooting

No File Picker: Ensure browser supports HTML5 File API (Chrome, Firefox, Safari).
File Not Processing: Verify file type (PDF, DOCX, TXT, PNG, JPG) and size (<10MB for images).
Theme Issues: Clear cache or hard refresh (Ctrl+F5).
Slow OCR: Test with small images; OCR is resource-intensive.

Notes

Offline after initial load (with local js/ files).
Image OCR may take seconds to minutes.

License
MIT License
