// === ScanShield Core Logic ===
// Comprehensive client-side document and image scanner with neon UI

// DOM Elements
const DOM = {
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    fileList: document.getElementById('file-list'),
    scanBtn: document.getElementById('scan-btn'),
    sanitizeBtn: document.getElementById('sanitize-btn'),
    progressBar: document.getElementById('progress-bar'),
    results: document.getElementById('results'),
    privacyScore: document.getElementById('privacy-score'),
    scoreText: document.getElementById('score-text'),
    scoreBreakdown: document.getElementById('score-breakdown'),
    metadataSection: document.getElementById('metadata'),
    metadataList: document.getElementById('metadata-list'),
    beforeContent: document.getElementById('before-content'),
    afterContent: document.getElementById('after-content'),
    exportTxt: document.getElementById('export-txt'),
    exportPdf: document.getElementById('export-pdf'),
    themeToggle: document.getElementById('theme-toggle'),
    languageSelect: document.getElementById('language-select'),
    statusMessage: document.getElementById('status-message'),
    scanLog: document.getElementById('scan-log'),
    logContent: document.getElementById('log-content')
};

// State Management
const state = {
    filesContent: [],
    scanResults: [],
    sanitizedContent: [],
    logs: [],
    isScanning: false,
    theme: localStorage.getItem('theme') || 'dark'
};

// Regex Patterns
const patterns = {
    en: {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b(\+\d{1,3}[-.\s]?)?(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s*\d{3}[-.\s]?\d{4})\b/g,
        id: /\b\d{3}-\d{2}-\d{4}\b/g, // SSN-like
        address: /\b\d{1,5}\s[A-Za-z\s]+(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road)\b/g,
        url: /\b(https?:\/\/)?(bit\.ly|t\.co|utm_\S+|[A-Za-z0-9-]+\.[a-z]{2,3}\/\S+)\b/g,
        keywords: /\b(salary|bank|home|dob|password|ssn)\b/gi
    },
    es: {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b(\+\d{1,3}[-.\s]?)?\d{9}\b/g,
        id: /\b\d{8}[A-Z]\b/g, // DNI-like
        address: /\bCalle|Avenida|Plaza\s[A-Za-z\s]+\d{1,5}\b/g,
        url: /\b(https?:\/\/)?(bit\.ly|t\.co|utm_\S+|[A-Za-z0-9-]+\.[a-z]{2,3}\/\S+)\b/g,
        keywords: /\b(salario|banco|hogar|fecha de nacimiento)\b/gi
    },
    fr: {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b(\+\d{1,3}[-.\s]?)?0\d{9}\b/g,
        id: /\b\d{12}\b/g, // INSEE-like
        address: /\b\d{1,5}\s(Rue|Avenue|Boulevard)\s[A-Za-z\s]+\b/g,
        url: /\b(https?:\/\/)?(bit\.ly|t\.co|utm_\S+|[A-Za-z0-9-]+\.[a-z]{2,3}\/\S+)\b/g,
        keywords: /\b(salaire|banque|maison|date de naissance)\b/gi
    }
};

// Risk Weights
const riskWeights = {
    email: 10,
    phone: 15,
    id: 20,
    address: 8,
    url: 5,
    keywords: 5
};

// Utility Functions
const utils = {
    log: (message, type = 'info') => {
        const timestamp = new Date().toISOString();
        state.logs.push(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
        DOM.logContent.textContent = state.logs.join('\n');
        DOM.scanLog.classList.remove('hidden');
        console.log(`[${type}] ${message}`);
    },
    showStatus: (message, type = 'info') => {
        DOM.statusMessage.textContent = message;
        DOM.statusMessage.className = `mt-4 text-sm ${type === 'error' ? 'text-red-400' : type === 'success' ? 'text-neon-green' : 'text-neon-gray'}`;
    },
    clearStatus: () => {
        DOM.statusMessage.textContent = '';
        DOM.statusMessage.className = 'mt-4 text-sm text-neon-gray';
    }
};

// Theme Management
const themeManager = {
    init: () => {
        if (state.theme === 'dark' || (!state.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark');
            DOM.themeToggle.querySelector('img').src = 'assets/icons/sun.svg';
        } else {
            document.body.classList.remove('dark');
            DOM.themeToggle.querySelector('img').src = 'assets/icons/moon.svg';
        }
    },
    toggle: () => {
        document.body.classList.toggle('dark');
        state.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
        DOM.themeToggle.querySelector('img').src = state.theme === 'dark' ? 'assets/icons/sun.svg' : 'assets/icons/moon.svg';
        localStorage.setItem('theme', state.theme);
        utils.log(`Theme switched to ${state.theme}`);
    }
};

// File Handling
const fileHandler = {
    validTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg'
    ],
    handleFiles: async (files) => {
        state.filesContent = [];
        DOM.fileList.innerHTML = '';
        utils.clearStatus();
        for (const file of files) {
            if (!fileHandler.validTypes.includes(file.type)) {
                utils.showStatus(`Unsupported file type: ${file.name}`, 'error');
                utils.log(`Rejected file ${file.name} due to unsupported type: ${file.type}`, 'error');
                continue;
            }
            state.filesContent.push({ name: file.name, file });
            DOM.fileList.innerHTML += `
                <div class="flex justify-between items-center p-2 bg-neon-dark rounded-lg">
                    <span class="text-sm text-neon-gray">${file.name}</span>
                    <button class="remove-file text-neon-pink hover:text-neon-purple" data-name="${file.name}">✕</button>
                </div>`;
            utils.log(`Added file: ${file.name}`);
        }
        DOM.scanBtn.disabled = state.filesContent.length === 0;
        if (state.filesContent.length > 0) {
            utils.showStatus(`${  ('success');
        }
        fileHandler.bindRemoveButtons();
    },
    bindRemoveButtons: () => {
        document.querySelectorAll('.remove-file').forEach(button => {
            button.addEventListener('click', () => {
                const name = button.dataset.name;
                state.filesContent = state.filesContent.filter(f => f.name !== name);
                button.parentElement.remove();
                DOM.scanBtn.disabled = state.filesContent.length === 0;
                utils.log(`Removed file: ${name}`);
                if (state.filesContent.length === 0) {
                    utils.showStatus('No files selected');
                }
            });
        });
    },
    readFile: async (file) => {
        return new Promise((resolve, reject) => {
            if (file.type === 'application/pdf') {
                if (!window.pdfjsLib) {
                    reject('pdf.js library not loaded');
                    return;
                }
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const typedArray = new Uint8Array(e.target.result);
                        const pdf = await pdfjsLib.getDocument(typedArray).promise;
                        let text = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            text += content.items.map(item => item.str).join(' ') + '\n';
                        }
                        resolve(text);
                        utils.log(`Successfully read PDF: ${file.name}`);
                    } catch (err) {
                        reject(`Error reading PDF: ${err.message}`);
                        utils.log(`Failed to read PDF ${file.name}: ${err.message}`, 'error');
                    }
                };
                reader.readAsArrayBuffer(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
                        resolve(result.value);
                        utils.log(`Successfully read DOCX: ${file.name}`);
                    } catch (err) {
                        reject(`Error reading DOCX: ${err.message}`);
                        utils.log(`Failed to read DOCX ${file.name}: ${err.message}`, 'error');
                    }
                };
                reader.readAsArrayBuffer(file);
            } else if (file.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(e.target.result);
                    utils.log(`Successfully read TXT: ${file.name}`);
                };
                reader.readAsText(file);
            } else if (file.type === 'image/png' || file.type === 'image/jpeg') {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const { data: { text } } = await Tesseract.recognize(e.target.result, 'eng', {
                            logger: (m) => utils.log(`OCR Progress for ${file.name}: ${m.status}`),
                        });
                        resolve(text);
                        utils.log(`Successfully processed image: ${file.name}`);
                    } catch (err) {
                        reject(`Error processing image: ${err.message}`);
                        utils.log(`Failed to process image ${file.name}: ${err.message}`, 'error');
                    }
                };
                reader.readAsDataURL(file);
            } else {
                reject('Unsupported file type');
            }
        });
    },
    extractMetadata: async (file) => {
        const metadata = {};
        if (file.type === 'application/pdf') {
            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onload = async (e) => {
                    try {
                        const typedArray = new Uint8Array(e.target.result);
                        const pdf = await pdfjsLib.getDocument(typedArray).promise;
                        const meta = await pdf.getMetadata();
                        metadata.author = meta.info.Author || 'Unknown';
                        metadata.created = meta.info.CreationDate || 'Unknown';
                        metadata.title = meta.info.Title || 'Unknown';
                        utils.log(`Extracted metadata for ${file.name}`);
                        resolve(metadata);
                    } catch {
                        utils.log(`No metadata available for ${file.name}`);
                        resolve({});
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        }
        return metadata;
    }
};

// Scanner Logic
const scanner = {
    scanContent: (content, lang) => {
        const result = {
            emails: [],
            phones: [],
            ids: [],
            addresses: [],
            urls: [],
            keywords: []
        };
        for (const [type, pattern] of Object.entries(patterns[lang])) {
            const matches = content.match(pattern) || [];
            result[type] = matches.map(match => ({
                value: match,
                risk: type === 'email' || type === 'phone' || type === 'id' ? 'high' : type === 'address' || type === 'keywords' ? 'medium' : 'low'
            }));
        }
        utils.log('Completed content scan');
        return result;
    },
    calculateScore: (results) => {
        let score = 100;
        let totalFindings = 0;
        results.forEach(fileResult => {
            for (const [type, matches] of Object.entries(fileResult.result)) {
                totalFindings += matches.length;
                score -= matches.length * riskWeights[type];
            }
        });
        score = Math.max(0, Math.round(score));
        const riskLevel = score < 40 ? 'High' : score < 70 ? 'Medium' : 'Low';
        utils.log(`Calculated privacy score: ${score} (${riskLevel})`);
        return { score, riskLevel, totalFindings };
    },
    sanitizeContent: (file) => {
        let content = file.content;
        file.result.emails.forEach(m => content = content.replaceAll(m.value, '[EMAIL REDACTED]'));
        file.result.phones.forEach(m => content = content.replaceAll(m.value, '[PHONE REDACTED]'));
        file.result.ids.forEach(m => content = content.replaceAll(m.value, '[ID REDACTED]'));
        file.result.addresses.forEach(m => content = content.replaceAll(m.value, '[ADDRESS REDACTED]'));
        file.result.urls.forEach(m => content = content.replaceAll(m.value, '[URL REDACTED]'));
        file.result.keywords.forEach(m => content = content.replaceAll(m.value, '[KEYWORD REDACTED]'));
        utils.log(`Sanitized content for ${file.name}`);
        return content;
    }
};

// UI Renderer
const renderer = {
    displayResults: () => {
        DOM.results.classList.add('fade-in');
        const { score, riskLevel, totalFindings } = scanner.calculateScore(state.scanResults);

        // Privacy Score
        DOM.privacyScore.classList.remove('hidden');
        DOM.scoreText.textContent = `${score}/100 (${riskLevel} Risk)`;
        DOM.scoreBreakdown.innerHTML = state.scanResults.flatMap(file => 
            Object.entries(file.result).map(([type, matches]) => 
                `<p>${type.charAt(0).toUpperCase() + type.slice(1)}: ${matches.length}</p>`
            )
        ).join('');
        utils.log(`Displayed privacy score: ${score}`);

        // Metadata
        state.scanResults.forEach(fileResult => {
            if (Object.keys(fileResult.metadata).length) {
                DOM.metadataSection.classList.remove('hidden');
                DOM.metadataList.innerHTML = Object.entries(fileResult.metadata).map(([key, value]) => 
                    `<li>${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}</li>`
                ).join('');
                utils.log(`Displayed metadata for ${fileResult.name}`);
            }
        });

        // Content
        DOM.beforeContent.innerHTML = '';
        state.scanResults.forEach(fileResult => {
            let displayContent = fileResult.content;
            for (const [type, matches] of Object.entries(fileResult.result)) {
                matches.forEach(match => {
                    const className = match.risk === 'high' ? 'high-risk' : match.risk === 'medium' ? 'medium-risk' : 'safe';
                    const tooltip = match.risk === 'high' 
                        ? 'High risk: Remove to avoid privacy issues.' 
                        : match.risk === 'medium' 
                        ? 'Medium risk: Review before sharing.' 
                        : 'Low risk: Generally safe.';
                    displayContent = displayContent.replaceAll(match.value, 
                        `<span class="${className} tooltip" data-tooltip="${tooltip}">${match.value}</span>`
                    );
                });
            }
            DOM.beforeContent.innerHTML += `
                <h5 class="font-medium mt-4 text-neon-white">${fileResult.name}</h5>
                <p>${displayContent}</p>`;
        });
        utils.log('Displayed scanned content');

        // Show Sanitize and Export
        DOM.sanitizeBtn.classList.remove('hidden');
        DOM.scanContent.classList.remove('hidden');
        DOM.exportOptions.classList.remove('hidden');
        utils.showStatus('Scan completed successfully', 'success');
    },
    updateProgress: (progress) => {
        DOM.progressBar.querySelector('div').style.width = `${progress}%`;
    }
};

// Event Listeners
const initEvents = () => {
    // Theme Toggle
    DOM.themeToggle.addEventListener('click', themeManager.toggle);

    // Drag and Drop
    DOM.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.dropZone.classList.add('border-neon-pink', 'bg-neon-dark', 'pulse');
    });

    DOM.dropZone.addEventListener('dragleave', () => {
        DOM.dropZone.classList.remove('border-neon-pink', 'bg-neon-dark', 'pulse');
    });

    DOM.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.dropZone.classList.remove('border-neon-pink', 'bg-neon-dark', 'pulse');
        fileHandler.handleFiles(e.dataTransfer.files);
    });

    DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());

    DOM.fileInput.addEventListener('change', () => {
        fileHandler.handleFiles(DOM.fileInput.files);
        DOM.fileInput.value = '';
    });

    // Scan Button
    DOM.scanBtn.addEventListener('click', async () => {
        if (state.filesContent.length === 0 || state.isScanning) return;
        state.isScanning = true;
        DOM.scanBtn.disabled = true;
        DOM.progressBar.classList.remove('hidden');
        state.scanResults = [];
        state.sanitizedContent = [];
        DOM.beforeContent.innerHTML = '';
        DOM.afterContent.innerHTML = '';
        utils.clearStatus();
        utils.log('Starting scan process');

        let progress = 0;
        const increment = 100 / state.filesContent.length;

        for (const { name, file } of state.filesContent) {
            try {
                utils.log(`Processing file: ${name}`);
                const content = await fileHandler.readFile(file);
                const metadata = await fileHandler.extractMetadata(file);
                const result = scanner.scanContent(content, DOM.languageSelect.value);
                state.scanResults.push({ name, content, result, metadata });
                progress += increment;
                renderer.updateProgress(progress);
            } catch (err) {
                utils.showStatus(`Error processing ${name}: ${err}`, 'error');
                utils.log(`Error processing ${name}: ${err}`, 'error');
            }
        }

        setTimeout(() => {
            DOM.progressBar.classList.add('hidden');
            renderer.displayResults();
            state.isScanning = false;
            DOM.scanBtn.disabled = state.filesContent.length === 0;
        }, 500);
    });

    // Sanitize Button
    DOM.sanitizeBtn.addEventListener('click', () => {
        state.sanitizedContent = state.scanResults.map(file => ({
            name: file.name,
            content: scanner.sanitizeContent(file)
        }));
        DOM.afterContent.innerHTML = state.sanitizedContent.map(file => `
            <h5 class="font-medium mt-4 text-neon-white">${file.name}</h5>
            <p>${file.content}</p>
        `).join('');
        utils.log('Sanitization completed');
        utils.showStatus('Content sanitized successfully', 'success');
    });

    // Export as TXT
    DOM.exportTxt.addEventListener('click', () => {
        const text = state.sanitizedContent.map(file => `File: ${file.name}\n${file.content}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sanitized.txt';
        a.click();
        URL.revokeObjectURL(url);
        utils.log('Exported sanitized content as TXT');
        utils.showStatus('Exported as TXT', 'success');
    });

    // Export as PDF
    DOM.exportPdf.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFont('Orbitron', 'normal');
        doc.text('ScanShield Sanitized Output', 10, 10);
        let y = 20;
        state.sanitizedContent.forEach(file => {
            doc.text(file.name, 10, y);
            y += 10;
            const lines = doc.splitTextToSize(file.content.substring(0, 500), 180);
            doc.text(lines, 10, y);
            y += lines.length * 10 + 10;
            if (y > 280) {
                doc.addPage();
                y = 10;
            }
        });
        doc.save('sanitized.pdf');
        utils.log('Exported sanitized content as PDF');
        utils.showStatus('Exported as PDF', 'success');
    });
};

// Initialization
const init = () => {
    themeManager.init();
    initEvents();
    utils.log('ScanShield initialized');
    utils.showStatus('Ready to scan files');
    // Ensure pdf.js worker is set
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    } else {
        utils.log('pdf.js not loaded', 'error');
        utils.showStatus('Error: pdf.js library not loaded', 'error');
    }
};

// Start Application
document.addEventListener('DOMContentLoaded', init);
