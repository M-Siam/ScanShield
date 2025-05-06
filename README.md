ScanShield — Smart Document Risk Checker
Protect your privacy before you share documents or images. Instantly scan for emails, phone numbers, IDs, addresses, and metadata — 100% free and offline.
Features

Upload and Scan: Drag-and-drop or click to upload PDF, DOCX, TXT, PNG, or JPG files.
Privacy Risk Detection: Detects emails, phone numbers, national IDs, addresses, tracking URLs, and sensitive keywords.
Image Scanning: Extracts text from images using OCR (Tesseract.js).
Risk Analysis: Color-coded highlights (High, Medium, Low risk) with tooltips.
Sanitization: Remove or replace risky information with a split-view (Before/After).
Privacy Score: 0–100 score with breakdown of findings.
Metadata Checker: Extracts author, creation date, etc., from PDFs.
Offline Support: No server or cloud APIs, 100% client-side.
Export Options: Save sanitized content as TXT or PDF.
Responsive Design: Mobile-first with dark/light mode toggle and modern light blue/white theme.

Deploy to GitHub Pages (No Git Installation Required)

Download Files: Save all files from this project into a folder named ScanShield.
Download Dependencies:
pdf.min.js and pdf.worker.min.js: From https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/.
mammoth.browser.min.js: From https://cdn.jsdelivr.net/npm/mammoth@1.6.0/.
tesseract.min.js: From https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js.
Place these in the js/ folder.


Create a GitHub Repository:
Go to https://github.com/new.
Name it ScanShield and create it (public or private).


Upload Files:
In your GitHub repository, click "Add file" > "Upload files".
Drag and drop the entire ScanShield folder or upload files individually, maintaining the folder structure.
Click "Commit changes".


Enable GitHub Pages:
Go to the repository's "Settings" tab.
Scroll to "Pages" in the left sidebar.
Under "Branch", select main and root folder (/), then click "Save".
Wait a few minutes, then access your site at https://your-username.github.io/ScanShield.



Test Locally

Open index.html in a browser (e.g., Chrome) to test the application locally.
Ensure all js/ files (pdf.min.js, pdf.worker.min.js, mammoth.browser.min.js, tesseract.min.js) are in place.

Dependencies

pdf.js: For PDF parsing (js/pdf.min.js, js/pdf.worker.min.js).
mammoth.js: For DOCX parsing (js/mammoth.browser.min.js).
Tesseract.js: For image OCR (js/tesseract.min.js).
Tailwind CSS: For styling (via CDN in css/style.css).
Inter Font: For typography (assets/fonts/inter.css).
jsPDF: For PDF export (via CDN in index.html).

Notes

The project works offline after the initial load, with all assets stored locally.
Image scanning may take longer due to OCR processing; ensure a stable internet connection for the first load to fetch Tesseract.js.

License
MIT License
