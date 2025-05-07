// === ScanShield Core Logic ===
// Production-grade client-side document and image scanner, fixed for GitHub Pages and Chrome

/**
 * Module: DOM Elements
 */
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
    logContent: document.getElementById('log-content'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    toastClose: document.getElementById('toast-close'),
    clearCacheBtn: document.getElementById('clear-cache-btn')
};

/**
 * Module: State Management
 */
const state = {
    filesContent: [],
    scanResults: [],
    sanitizedContent: [],
    logs: [],
    isScanning: false,
    theme: localStorage.getItem('theme') || 'light'
};

/**
 * Module: Regex Patterns
 */
const patterns = {
    en: {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b(\+\d{1,3}[-.\s]?)?(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s*\d{3}[-.\s]?\d{4})\b/g,
        id: /\b\d{3}-\d{2}-\d{4}\b/g,
        address: /\b\d{1,5}\s[A-Za-z\s]+(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road)\b/gi,
        url: /\b(https?:\/\/)?([A-Za-z0-9-]+\.[a-z]{2,3}(\/\S*)?|bit\.ly|t\.co|utm_\S+)\b/g,
        keywords: /\b(salary|bank|home|dob|password|ssn)\b/gi
    },
    es: {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b(\+\d{1,3}[-.\s]?)?\d{9}\b/g,
        id: /\b\d{8}[A-Z]\b/g,
        address: /\b(Calle|Avenida|Plaza)\s[A-Za-z\s]+\d{1,5}\b/gi,
        url: /\b(https?:\/\/)?([A-Za-z0-9-]+\.[a-z]{2,3}(\/\S*)?|bit\.ly|t\.co|utm_\S+)\b/g,
        keywords: /\b(salario|banco|hogar|fecha de nacimiento)\b/gi
    },
    fr: {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b(\+\d{1,3}[-.\s]?)?0\d{9}\b/g,
        id: /\b\d{12}\b/g,
        address: /\b\d{1,5}\s(Rue|Avenue|Boulevard)\s[A-Za-z\s]+\b/gi,
        url: /\b(https?:\/\/)?([A-Za-z0-9-]+\.[a-z]{2,3}(\/\S*)?|bit\.ly|t\.co|utm_\S+)\b/g,
        keywords: /\b(salaire|banque|maison|date de naissance)\b/gi
    }
};

/**
 * Module: Risk Weights
 */
const riskWeights = {
    email: 10,
    phone: 15,
    id: 20,
    address: 8,
    url: 5,
    keywords: 5
};

/**
 * Module: Utilities
 */
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
        DOM.statusMessage.className = `mt-4 text-sm ${
            type === 'error' ? 'text-red-600' : type === 'success' ? 'text-green-600' : 'text-gray-500'
        }`;
    },
    clearStatus: () => {
        DOM.statusMessage.textContent = '';
        DOM.statusMessage.className = 'mt-4 text-sm text-gray-500';
    },
    showToast: (message, duration = 3000) => {
        DOM.toastMessage.textContent = message;
        DOM.toast.classList.remove('hidden');
        setTimeout(() => DOM.toast.classList.add('hidden'), duration);
    },
    escapeHTML: (str) => {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

/**
 * Module: Theme Management
 */
const themeManager = {
    init: () => {
        try {
            if (state.theme === 'dark') {
                document.documentElement.classList.add('dark');
                DOM.themeToggle.querySelector('img').src = 'assets/icons/sun.svg';
            } else {
                document.documentElement.classList.remove('dark');
                DOM.themeToggle.querySelector('img').src = 'assets/icons/moon.svg';
            }
            utils.log(`Initialized theme: ${state.theme}`);
        } catch (err) {
            utils.log(`Theme init error: ${err.message}`, 'error');
        }
    },
    toggle: () => {
        try {
            document.documentElement.classList.toggle('dark');
            state.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            DOM.themeToggle.querySelector('img').src = state.theme === 'dark' ? 'assets/icons/sun.svg' : 'assets/icons/moon.svg';
            localStorage.setItem('theme', state.theme);
            utils.log(`Theme switched to ${state.theme}`);
        } catch (err) {
            utils.log(`Theme toggle error: ${err.message}`, 'error');
        }
    }
};

/**
 * Module: Cache Management
 */
const cacheManager = {
    clear: () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            state.theme = 'light';
            themeManager.init();
            utils.showToast('Cache cleared successfully', 2000);
            utils.log('Cache cleared');
            setTimeout(() => location.reload(true), 1000); // Hard reload
        } catch (err) {
            utils.showToast('Error clearing cache', 2000);
            utils.log(`Cache clear error: ${err.message}`, 'error');
        }
    }
};

/**
 * Module: File Handling
 */
const fileHandler = {
    validTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg'
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    handleFiles: async (files) => {
        try {
            state.filesContent = [];
            DOM.fileList.innerHTML = '';
            utils.clearStatus();
            if (!files || files.length === 0) {
                utils.showStatus('No files selected', 'error');
                utils.showToast('No files selected', 2000);
                return;
            }
            const existingNames = new Set();
            for (const file of Array.from(files)) {
                if (!fileHandler.validTypes.includes(file.type)) {
                    utils.showStatus(`Unsupported file: ${file.name}`, 'error');
                    utils.showToast(`Unsupported file: ${file.name}`, 2000);
                    utils.log(`Rejected file ${file.name}: Invalid type ${file.type}`, 'error');
                    continue;
                }
                if (file.size > fileHandler.maxFileSize) {
                    utils.showStatus(`File too large: ${file.name} (>10MB)`, 'error');
                    utils.showToast(`File too large: ${file.name}`, 2000);
                    utils.log(`Rejected file ${file.name}: Size ${file.size} exceeds 10MB`, 'error');
                    continue;
                }
                if (existingNames.has(file.name.toLowerCase())) {
                    utils.showStatus(`Duplicate file: ${file.name}`, 'error');
                    utils.showToast(`Duplicate file: ${file.name}`, 2000);
                    utils.log(`Rejected file ${file.name}: Duplicate`, 'error');
                    continue;
                }
                existingNames.add(file.name.toLowerCase());
                state.filesContent.push({ name: file.name, file });
                DOM.fileList.innerHTML += `
                    <div class="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                        <span class="text-sm text-gray-600 dark:text-gray-300 truncate">${file.name}</span>
                        <button class="remove-file text-red-600 hover:text-red-700" data-name="${file.name}" aria-label="Remove file">✕</button>
                    </div>`;
                utils.showToast(`Added file: ${file.name}`, 2000);
                utils.log(`Added file: ${file.name}`);
            }
            DOM.scanBtn.disabled = state.filesContent.length === 0;
            if (state.filesContent.length > 0) {
                utils.showStatus(`${state.filesContent.length} file(s) ready to scan`, 'success');
            } else {
                utils.showStatus('No valid files selected', 'error');
            }
            fileHandler.bindRemoveButtons();
        } catch (err) {
            utils.showStatus('Error handling files', 'error');
            utils.showToast('Error handling files', 2000);
            utils.log(`File handling error: ${err.message}`, 'error');
        }
    },
    bindRemoveButtons: () => {
        try {
            document.querySelectorAll('.remove-file').forEach(button => {
                button.addEventListener('click', () => {
                    const name = button.dataset.name;
                    state.filesContent = state.filesContent.filter(f => f.name !== name);
                    button.parentElement.remove();
                    DOM.scanBtn.disabled = state.filesContent.length === 0;
                    utils.showToast(`Removed file: ${name}`, 2000);
                    utils.log(`Removed file: ${name}`);
                    if (state.filesContent.length === 0) {
                        utils.showStatus('No files selected');
                    } else {
                        utils.showStatus(`${state.filesContent.length} file(s) ready to scan`, 'success');
                    }
                });
            });
        } catch (err) {
            utils.log(`Remove button binding error: ${err.message}`, 'error');
        }
    },
    readFile: async (file, retryCount = 0) => {
        const maxRetries = 2;
        return new Promise((resolve, reject) => {
            try {
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
                            for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
                                const page = await pdf.getPage(i);
                                const content = await page.getTextContent();
                                text += content.items.map(item => item.str || '').join(' ') + '\n';
                            }
                            if (!text.trim()) throw new Error('No text extracted');
                            resolve(text);
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
                            if (!result.value.trim()) throw new Error('No text extracted');
                            resolve(result.value);
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
                        const text = e.target.result;
                        if (!text.trim()) throw new Error('No text extracted');
                        resolve(text);
                        utils.log(`Read TXT: ${file.name}`);
                    };
                    reader.onerror = () => reject('FileReader error');
                    reader.readAsText(file);
                } else if (file.type === 'image/png' || file.type === 'image/jpeg') {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const { data: { text } } = await Tesseract.recognize(e.target.result, 'eng', {
                                logger: (m) => utils.log(`OCR Progress for ${file.name}: ${m.status}`),
                            });
                            if (!text.trim()) throw new Error('No text extracted');
                            resolve(text);
                            utils.log(`Processed image: ${file.name}`);
                        } catch (err) {
                            if (retryCount < maxRetries) {
                                utils.log(`Retrying image ${file.name} (${retryCount + 1}/${maxRetries})`, 'warn');
                                setTimeout(() => fileHandler.readFile(file, retryCount + 1).then(resolve).catch(reject), 1000);
                            } else {
                                reject(`Error processing image: ${err.message}`);
                                utils.log(`Failed to read image ${file.name}: ${err.message}`, 'error');
                            }
                        }
                    };
                    reader.onerror = () => reject('FileReader error');
                    reader.readAsDataURL(file);
                } else {
                    reject('Unsupported file type');
                }
            } catch (err) {
                reject(`Unexpected error: ${err.message}`);
                utils.log(`Unexpected error in ${file.name}: ${err.message}`, 'error');
            }
        });
    },
    extractMetadata: async (file) => {
        try {
            if (file.type === 'application/pdf') {
                const reader = new FileReader();
                return new Promise((resolve) => {
                    reader.onload = async (e) => {
                        try {
                            const typedArray = new Uint8Array(e.target.result);
                            const pdf = await pdfjsLib.getDocument(typedArray).promise;
                            const meta = await pdf.getMetadata();
                            const metadata = {
                                author: meta.info.Author || 'Unknown',
                                created: meta.info.CreationDate || 'Unknown',
                                title: meta.info.Title || 'Unknown'
                            };
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
            return {};
        } catch (err) {
            utils.log(`Metadata extraction error for ${file.name}: ${err.message}`, 'error');
            return {};
        }
    }
};

/**
 * Module: Scanner Logic
 */
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
        try {
            if (!content || typeof content !== 'string') throw new Error('Invalid content');
            for (const [type, pattern] of Object.entries(patterns[lang])) {
                const matches = content.match(pattern) || [];
                result[type] = matches.map(match => ({
                    value: match,
                    risk: type === 'email' || type === 'phone' || type === 'id' ? 'high' : type === 'address' || type === 'keywords' ? 'medium' : 'low'
                }));
            }
            utils.log('Content scan completed');
        } catch (err) {
            utils.log(`Scan error: ${err.message}`, 'error');
        }
        return result;
    },
    calculateScore: (results) => {
        try {
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
        } catch (err) {
            utils.log(`Score calculation error: ${err.message}`, 'error');
            return { score: 100, riskLevel: 'Unknown', totalFindings: 0 };
        }
    },
    sanitizeContent: (file) => {
        let content = file.content;
        try {
            file.result.emails.forEach(m => content = content.replaceAll(m.value, '[EMAIL REDACTED]'));
            file.result.phones.forEach(m => content = content.replaceAll(m.value, '[PHONE REDACTED]'));
            file.result.ids.forEach(m => content = content.replaceAll(m.value, '[ID REDACTED]'));
            file.result.addresses.forEach(m => content = content.replaceAll(m.value, '[ADDRESS REDACTED]'));
            file.result.urls.forEach(m => content = content.replaceAll(m.value, '[URL REDACTED]'));
            file.result.keywords.forEach(m => content = content.replaceAll(m.value, '[KEYWORD REDACTED]'));
            utils.log(`Sanitized ${file.name}`);
            return content;
        } catch (err) {
            utils.log(`Sanitization error for ${file.name}: ${err.message}`, 'error');
            return content;
        }
    }
};

/**
 * Module: UI Renderer
 */
const renderer = {
    displayResults: () => {
        try {
            DOM.results.classList.add('animate-fadeIn');
            const { score, riskLevel, totalFindings } = scanner.calculateScore(state.scanResults);

            DOM.privacyScore.classList.remove('hidden');
            DOM.scoreText.textContent = totalFindings > 0 ? `${score}/100 (${riskLevel} Risk)` : '100/100 (No Risks)';
            DOM.scoreBreakdown.innerHTML = state.scanResults.flatMap(file => 
                Object.entries(file.result).map(([type, matches]) => 
                    `<p>${type.charAt(0).toUpperCase() + type.slice(1)}: ${matches.length}</p>`
                )
            ).join('') || '<p>No sensitive data found</p>';
            utils.log(`Displayed score: ${score}`);

            DOM.metadataSection.classList.add('hidden');
            state.scanResults.forEach(fileResult => {
                if (Object.keys(fileResult.metadata).length) {
                    DOM.metadataSection.classList.remove('hidden');
                    DOM.metadataList.innerHTML = Object.entries(fileResult.metadata).map(([key, value]) => 
                        `<li>${key.charAt(0).toUpperCase() + key.slice(1)}: ${utils.escapeHTML(value)}</li>`
                    ).join('');
                    utils.log(`Displayed metadata for ${fileResult.name}`);
                }
            });

            DOM.beforeContent.innerHTML = '';
            state.scanResults.forEach(fileResult => {
                let displayContent = utils.escapeHTML(fileResult.content);
                for (const [type, matches] of Object.entries(fileResult.result)) {
                    matches.forEach(match => {
                        const className = match.risk === 'high' ? 'high-risk' : match.risk === 'medium' ? 'medium-risk' : 'safe';
                        const tooltip = match.risk === 'high' 
                            ? 'High risk: Remove to avoid privacy issues.' 
                            : match.risk === 'medium' 
                            ? 'Medium risk: Review before sharing.' 
                            : 'Low risk: Generally safe.';
                        const escapedMatch = utils.escapeHTML(match.value);
                        displayContent = displayContent.replaceAll(escapedMatch, 
                            `<span class="${className} tooltip" data-tooltip="${tooltip}">${escapedMatch}</span>`
                        );
                    });
                }
                DOM.beforeContent.innerHTML += `
                    <h5 class="font-medium mt-4">${utils.escapeHTML(fileResult.name)}</h5>
                    <p>${displayContent}</p>`;
            });
            utils.log('Displayed content');

            if (totalFindings > 0) {
                DOM.sanitizeBtn.classList.remove('hidden');
                DOM.scanContent.classList.remove('hidden');
                DOM.exportOptions.classList.remove('hidden');
            }
            utils.showStatus(totalFindings > 0 ? 'Scan completed with findings' : 'Scan completed: No risks found', 'success');
            utils.showToast(totalFindings > 0 ? 'Scan completed with findings' : 'Scan completed: No risks found', 2000);
        } catch (err) {
            utils.showStatus('Error displaying results', 'error');
            utils.showToast('Error displaying results', 2000);
            utils.log(`Display error: ${err.message}`, 'error');
        }
    },
    updateProgress: (progress) => {
        try {
            DOM.progressBar.querySelector('div').style.width = `${Math.min(progress, 100)}%`;
        } catch {
            utils.log('Progress bar update failed', 'warn');
        }
    }
};

/**
 * Module: Event Listeners
 */
const initEvents = () => {
    try {
        // Theme Toggle
        DOM.themeToggle.addEventListener('click', themeManager.toggle);

        // Cache Clear
        DOM.clearCacheBtn.addEventListener('click', cacheManager.clear);

        // Toast Close
        DOM.toastClose.addEventListener('click', () => {
            DOM.toast.classList.add('hidden');
        });

        // Drag and Drop
        DOM.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            DOM.dropZone.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-gray-700');
        });

        DOM.dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            DOM.dropZone.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-gray-700');
        });

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
            utils.showToast('Files dropped', 2000);
            utils.log('Files dropped');
        });

        // File Input
        DOM.dropZone.addEventListener('click', (e) => {
            e.preventDefault();
            try {
                DOM.fileInput.click();
                utils.showToast('Opening file picker', 2000);
                utils.log('File picker triggered');
            } catch (err) {
                utils.showStatus('Error opening file picker', 'error');
                utils.showToast('Error opening file picker', 2000);
                utils.log(`File picker error: ${err.message}`, 'error');
            }
        });

        DOM.fileInput.addEventListener('change', () => {
            try {
                fileHandler.handleFiles(DOM.fileInput.files);
                DOM.fileInput.value = '';
                utils.log('Files selected via input');
            } catch (err) {
                utils.showStatus('Error processing files', 'error');
                utils.showToast('Error processing files', 2000);
                utils.log(`File input change error: ${err.message}`, 'error');
            }
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
            DOM.privacyScore.classList.add('hidden');
            DOM.metadataSection.classList.add('hidden');
            DOM.scanContent.classList.add('hidden');
            DOM.exportOptions.classList.add('hidden');
            DOM.sanitizeBtn.classList.add('hidden');
            utils.clearStatus();
            utils.log('Starting scan');

            let progress = 0;
            const increment = 100 / state.filesContent.length;

            for (const { name, file } of state.filesContent) {
                try {
                    utils.showStatus(`Processing ${name}...`);
                    utils.showToast(`Processing ${name}...`, 2000);
                    const content = await fileHandler.readFile(file);
                    const metadata = await fileHandler.extractMetadata(file);
                    const result = scanner.scanContent(content, DOM.languageSelect.value);
                    state.scanResults.push({ name, content, result, metadata });
                    progress += increment;
                    renderer.updateProgress(progress);
                } catch (err) {
                    utils.showStatus(`Error processing ${name}: ${err}`, 'error');
                    utils.showToast(`Error processing ${name}`, 2000);
                    utils.log(`Error processing ${name}: ${err}`, 'error');
                }
            }

            try {
                DOM.progressBar.classList.add('hidden');
                renderer.displayResults();
                state.isScanning = false;
                DOM.scanBtn.disabled = state.filesContent.length === 0;
            } catch (err) {
                utils.showStatus('Error finalizing scan', 'error');
                utils.showToast('Error finalizing scan', 2000);
                utils.log(`Scan finalization error: ${err.message}`, 'error');
                state.isScanning = false;
                DOM.scanBtn.disabled = state.filesContent.length === 0;
            }
        });

        // Sanitize Button
        DOM.sanitizeBtn.addEventListener('click', () => {
            try {
                state.sanitizedContent = state.scanResults.map(file => ({
                    name: file.name,
                    content: scanner.sanitizeContent(file)
                }));
                DOM.afterContent.innerHTML = state.sanitizedContent.map(file => `
                    <h5 class="font-medium mt-4">${utils.escapeHTML(file.name)}</h5>
                    <p>${utils.escapeHTML(file.content)}</p>
                `).join('');
                utils.showToast('Content sanitized', 2000);
                utils.log('Sanitization completed');
                utils.showStatus('Content sanitized', 'success');
            } catch (err) {
                utils.showStatus('Error sanitizing content', 'error');
                utils.showToast('Error sanitizing content', 2000);
                utils.log(`Sanitization error: ${err.message}`, 'error');
            }
        });

        // Export as TXT
        DOM.exportTxt.addEventListener('click', () => {
            try {
                const text = state.sanitizedContent.map(file => `File: ${file.name}\n${file.content}`).join('\n\n');
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sanitized.txt';
                a.click();
                URL.revokeObjectURL(url);
                utils.showToast('Exported as TXT', 2000);
                utils.log('Exported as TXT');
                utils.showStatus('Exported as TXT', 'success');
            } catch (err) {
                utils.showStatus('Error exporting TXT', 'error');
                utils.showToast('Error exporting TXT', 2000);
                utils.log(`TXT export error: ${err.message}`, 'error');
            }
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
                    const lines = doc.splitTextToSize(file.content.substring(0, 500), 180);
                    doc.text(lines, 10, y);
                    y += lines.length * 10 + 10;
                    if (y > 280) {
                        doc.addPage();
                        y = 10;
                    }
                });
                doc.save('sanitized.pdf');
                utils.showToast('Exported as PDF', 2000);
                utils.log('Exported as PDF');
                utils.showStatus('Exported as PDF', 'success');
            } catch (err) {
                utils.showStatus('Error exporting PDF', 'error');
                utils.showToast('Error exporting PDF', 2000);
                utils.log(`PDF export error: ${err.message}`, 'error');
            }
        });
    } catch (err) {
        utils.log(`Event binding error: ${err.message}`, 'error');
        utils.showStatus('Error initializing interactions', 'error');
        utils.showToast('Error initializing app', 2000);
    }
};

/**
 * Module: Initialization
 */
const init = () => {
    try {
        themeManager.init();
        initEvents();
        utils.log('ScanShield initialized');
        utils.showStatus('Ready to scan files');
        utils.showToast('ScanShield ready', 2000);
        if (window.pdfjsLib) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.min.js';
            utils.log('pdf.js loaded');
        } else {
            utils.log('pdf.js not loaded', 'error');
            utils.showStatus('Error: PDF scanning unavailable', 'error');
            utils.showToast('PDF scanning unavailable', 2000);
        }
        if (!window.Tesseract) {
            utils.log('Tesseract.js not loaded', 'error');
            utils.showStatus('Warning: Image scanning unavailable', 'error');
            utils.showToast('Image scanning unavailable', 2000);
        }
    } catch (err) {
        utils.log(`Initialization error: ${err.message}`, 'error');
        utils.showStatus('Error initializing app', 'error');
        utils.showToast('Error initializing app', 2000);
    }
};

// Start Application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
