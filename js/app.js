// === ScanShield Core Logic ===
// Robust, professional client-side document and image scanner

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
    theme: localStorage.getItem('theme') || 'light'
};

// Enhanced Regex Patterns
const patterns = {
    en: {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b(\+\d{1,3}[-.\s]?)?(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s*\d{3}[-.\s]?\d{4})\b/g,
        id: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g, // SSN or similar
        address: /\b\d{1,5}\s[A-Za-z\s]+?(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Ln|Lane)\b/gi,
        url: /\b(https?:\/\/)?([A-Za-z0-9-]+\.[a-z]{2,3}(\/\S*)?|bit\.ly|t\.co|utm_\S+)\b/gi,
        keywords: /\b(salary|bank|account|home|dob|password|ssn|credit|card)\b/gi
    },
    es: {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b(\+\d{1,3}[-.\s]?)?\d{9}\b/g,
        id: /\b\d{8}[A-Z]\b/g, // DNI-like
        address: /\b(Calle|Avenida|Plaza)\s[A-Za-z\s]+\d{1,5}\b/gi,
        url: /\b(https?:\/\/)?([A-Za-z0-9-]+\.[a-z]{2,3}(\/\S*)?|bit\.ly|t\.co|utm_\S+)\b/gi,
        keywords: /\b(salario|banco|cuenta|hogar|fecha de nacimiento|contraseña)\b/gi
    },
    fr: {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b(\+\d{1,3}[-.\s]?)?0\d{9}\b/g,
        id: /\b\d{12}\b/g, // INSEE-like
        address: /\b\d{1,5}\s(Rue|Avenue|Boulevard)\s[A-Za-z\s]+\b/gi,
        url: /\b(https?:\/\/)?([A-Za-z0-9-]+\.[a-z]{2,3}(\/\S*)?|bit\.ly|t\.co|utm_\S+)\b/gi,
        keywords: /\b(salaire|banque|compte|maison|date de naissance|mot de passe)\b/gi
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
        DOM.logContent.textContent = state.logs.slice(-50).join('\n');
        DOM.scanLog.classList.remove('hidden');
        console.log(`[${type}] ${message}`);
    },
    showStatus: (message, type = 'info') => {
        DOM.statusMessage.textContent = message;
        DOM.statusMessage.className = `mt-4 text-sm ${type === 'error' ? 'text-red-600' : type === 'success' ? 'text-green-600' : 'text-gray-500'}`;
    },
    clearStatus: () => {
        DOM.statusMessage.textContent = '';
        DOM.statusMessage.className = 'mt-4 text-sm text-gray-500';
    },
    debounce: (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    },
    normalizeText: (text) => {
        if (!text) return '';
        return text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[\r\n]+/g, '\n') // Normalize line breaks
            .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
            .trim();
    }
};

// Theme Management
const themeManager = {
    init: () => {
        if (state.theme === 'dark') {
            document.body.classList.add('dark');
            DOM.themeToggle.querySelector('img').src = 'assets/icons/sun.svg';
        } else {
            document.body.classList.remove('dark');
            DOM.themeToggle.querySelector('img').src = 'assets/icons/moon.svg';
        }
        utils.log(`Initialized theme: ${state.theme}`);
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
        if (!files || files.length === 0) {
            utils.showStatus('No files selected', 'error');
            utils.log('No files selected', 'error');
            return;
        }
        const newFiles = Array.from(files).filter(file => 
            !state.filesContent.some(f => f.name === file.name && f.file.size === file.size)
        );
        if (newFiles.length === 0) {
            utils.showStatus('All selected files are already uploaded', 'error');
            utils.log('Duplicate files rejected', 'warn');
            return;
        }
        for (const file of newFiles) {
            if (!fileHandler.validTypes.includes(file.type)) {
                utils.showStatus(`Unsupported file: ${file.name}`, 'error');
                utils.log(`Rejected file ${file.name}: Invalid type ${file.type}`, 'error');
                continue;
            }
            state.filesContent.push({ name: file.name, file });
            DOM.fileList.innerHTML += `
                <div class="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <span class="text-sm text-gray-600 dark:text-gray-300">${file.name}</span>
                    <button class="remove-file text-red-600 hover:text-red-700" data-name="${file.name}">✕</button>
                </div>`;
            utils.log(`Added file: ${file.name}`);
        }
        DOM.scanBtn.disabled = state.filesContent.length === 0;
        utils.showStatus(`${state.filesContent.length} file(s) ready to scan`, 'success');
        fileHandler.bindRemoveButtons();
        DOM.fileInput.value = ''; // Reset file input
    },
    bindRemoveButtons: () => {
        document.querySelectorAll('.remove-file').forEach(button => {
            button.removeEventListener('click', button._handler); // Prevent duplicate listeners
            button._handler = () => {
                const name = button.dataset.name;
                state.filesContent = state.filesContent.filter(f => f.name !== name);
                button.parentElement.remove();
                DOM.scanBtn.disabled = state.filesContent.length === 0;
                utils.log(`Removed file: ${name}`);
                utils.showStatus(`${state.filesContent.length} file(s) ready to scan`, state.filesContent.length > 0 ? 'success' : 'info');
            };
            button.addEventListener('click', button._handler);
        });
    },
    readFile: async (file, retryCount = 0) => {
        const maxRetries = 3;
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
                        resolve(utils.normalizeText(text));
                        utils.log(`Read PDF: ${file.name}`);
                    } catch (err) {
                        if (retryCount < maxRetries) {
                            utils.log(`Retrying PDF ${file.name} (${retryCount + 1}/${maxRetries})`, 'warn');
                            setTimeout(() => fileHandler.readFile(file, retryCount + 1).then(resolve).catch(reject), 1000);
                        } else {
                            reject(`Error reading PDF: ${err.message}`);
                            utils.log(`Failed to read PDF ${file.name}: ${err.message}`, 'error');
                        }
                    }
                };
                reader.onerror = () => reject('FileReader error');
                reader.readAsArrayBuffer(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
                        resolve(utils.normalizeText(result.value));
                        utils.log(`Read DOCX: ${file.name}`);
                    } catch (err) {
                        if (retryCount < maxRetries) {
                            utils.log(`Retrying DOCX ${file.name} (${retryCount + 1}/${maxRetries})`, 'warn');
                            setTimeout(() => fileHandler.readFile(file, retryCount + 1).then(resolve).catch(reject), 1000);
                        } else {
                            reject(`Error reading DOCX: ${err.message}`);
                            utils.log(`Failed to read DOCX ${file.name}: ${err.message}`, 'error');
                        }
                    }
                };
                reader.onerror = () => reject('FileReader error');
                reader.readAsArrayBuffer(file);
            } else if (file.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(utils.normalizeText(e.target.result));
                    utils.log(`Read TXT: ${file.name}`);
                };
                reader.onerror = () => reject('FileReader error');
                reader.readAsText(file);
            } else if (file.type === 'image/png' || file.type === 'image/jpeg') {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const img = new Image();
                        img.src = e.target.result;
                        await new Promise((res, rej) => {
                            img.onload = res;
                            img.onerror = () => rej('Image load error');
                        });
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const maxSize = 1000;
                        let width = img.width;
                        let height = img.height;
                        if (width > height && width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        } else if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        const { data: { text } } = await Tesseract.recognize(canvas.toDataURL(), 'eng', {
                            logger: (m) => utils.log(`OCR Progress for ${file.name}: ${m.status}`)
                        });
                        resolve(utils.normalizeText(text));
                        utils.log(`Processed image: ${file.name}`);
                    } catch (err) {
                        if (retryCount < maxRetries) {
                            utils.log(`Retrying image ${file.name} (${retryCount + 1}/${maxRetries})`, 'warn');
                            setTimeout(() => fileHandler.readFile(file, retryCount + 1).then(resolve).catch(reject), 1000);
                        } else {
                            reject(`Error processing image: ${err.message}`);
                            utils.log(`Failed to process image ${file.name}: ${err.message}`, 'error');
                        }
                    }
                };
                reader.onerror = () => reject('FileReader error');
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
                        utils.log(`No metadata for ${file.name}`);
                        resolve({});
                    }
                };
                reader.onerror = () => resolve({});
                reader.readAsArrayBuffer(file);
            });
        }
        return metadata;
    }
};

// Scanner Logic
const scanner = {
    scanContent: (content, lang) => {
        if (!content) return { emails: [], phones: [], ids: [], addresses: [], urls: [], keywords: [] };
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
        utils.log('Content scan completed');
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
        utils.log(`Privacy score: ${score} (${riskLevel})`);
        return { score, riskLevel, totalFindings };
    },
    sanitizeContent: (file) => {
        let content = file.content || '';
        file.result.emails.forEach(m => content = content.replaceAll(m.value, '[EMAIL REDACTED]'));
        file.result.phones.forEach(m => content = content.replaceAll(m.value, '[PHONE REDACTED]'));
        file.result.ids.forEach(m => content = content.replaceAll(m.value, '[ID REDACTED]'));
        file.result.addresses.forEach(m => content = content.replaceAll(m.value, '[ADDRESS REDACTED]'));
        file.result.urls.forEach(m => content = content.replaceAll(m.value, '[URL REDACTED]'));
        file.result.keywords.forEach(m => content = content.replaceAll(m.value, '[KEYWORD REDACTED]'));
        utils.log(`Sanitized ${file.name}`);
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
        DOM.scoreText.textContent = totalFindings > 0 ? `${score}/100 (${riskLevel} Risk)` : '100/100 (No Risks)';
        DOM.scoreBreakdown.innerHTML = state.scanResults.flatMap(file => 
            Object.entries(file.result).map(([type, matches]) => 
                `<p>${type.charAt(0).toUpperCase() + type.slice(1)}: ${matches.length}</p>`
            )
        ).join('') || '<p>No sensitive data detected</p>';
        utils.log(`Displayed score: ${score}`);

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
            let displayContent = fileResult.content || 'No text extracted';
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
                <h5 class="font-medium mt-4">${fileResult.name}</h5>
                <p>${displayContent}</p>`;
        });
        utils.log('Displayed content');

        // Show Sanitize and Export
        DOM.sanitizeBtn.classList.remove('hidden');
        DOM.scanContent.classList.remove('hidden');
        DOM.exportOptions.classList.remove('hidden');
        utils.showStatus('Scan completed', 'success');
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
    const handleDragOver = utils.debounce((e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.dropZone.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-gray-700');
    }, 100);
    DOM.dropZone.addEventListener('dragover', handleDragOver);
    DOM.dropZone.addEventListener('dragenter', handleDragOver);

    DOM.dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.dropZone.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-gray-700');
    });

    DOM.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.dropZone.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-gray-700');
        fileHandler.handleFiles(e.dataTransfer.files);
        utils.log('Files dropped');
    });

    // File Input
    DOM.dropZone.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.fileInput.click();
        utils.log('File input triggered');
    });

    DOM.fileInput.addEventListener('change', (e) => {
        fileHandler.handleFiles(e.target.files);
        utils.log('Files selected via input');
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
        utils.log('Starting scan');

        let progress = 0;
        const increment = 100 / state.filesContent.length;

        for (const { name, file } of state.filesContent) {
            try {
                utils.log(`Processing ${name}`);
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
            <h5 class="font-medium mt-4">${file.name}</h5>
            <p>${file.content || 'No text extracted'}</p>
        `).join('');
        utils.log('Sanitization completed');
        utils.showStatus('Content sanitized', 'success');
    });

    // Export as TXT
    DOM.exportTxt.addEventListener('click', () => {
        const text = state.sanitizedContent.map(file => `File: ${file.name}\n${file.content || 'No text extracted'}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sanitized.txt';
        a.click();
        URL.revokeObjectURL(url);
        utils.log('Exported as TXT');
        utils.showStatus('Exported as TXT', 'success');
    });

    // Export as PDF
    DOM.exportPdf.addEventListener('click', () => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFont('Inter', 'normal');
            doc.text('ScanShield Sanitized Output', 10, 10);
            let y = 20;
            state.sanitizedContent.forEach(file => {
                doc.text(file.name, 10, y);
                y += 10;
                const lines = doc.splitTextToSize(file.content.substring(0, 500) || 'No text extracted', 180);
                doc.text(lines, 10, y);
                y += lines.length * 10 + 10;
                if (y > 280) {
                    doc.addPage();
                    y = 10;
                }
            });
            doc.save('sanitized.pdf');
            utils.log('Exported as PDF');
            utils.showStatus('Exported as PDF', 'success');
        } catch (err) {
            utils.showStatus('Error exporting PDF', 'error');
            utils.log(`PDF export error: ${err.message}`, 'error');
        }
    });
};

// Initialization
const init = () => {
    themeManager.init();
    initEvents();
    utils.log('ScanShield initialized');
    utils.showStatus('Ready to scan files');
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        utils.log('pdf.js loaded');
    } else {
        utils.log('pdf.js not loaded', 'error');
        utils.showStatus('Error: pdf.js not loaded', 'error');
    }
    // Polyfill for older browsers
    if (!window.Promise) {
        utils.log('Adding Promise polyfill', 'warn');
        document.write('<script src="https://cdn.jsdelivr.net/npm/es6-promise@4.2.8/dist/es6-promise.auto.min.js"></script>');
    }
};

// Start Application
document.addEventListener('DOMContentLoaded', init);
