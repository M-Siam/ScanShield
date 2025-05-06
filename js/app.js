// === ScanShield Core Logic ===
// Simplified, robust client-side document scanner with fixed file handling

// ============================================================================
// DOM Elements
// ============================================================================
const DOM = {
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    fileList: document.getElementById('file-list'),
    scanBtn: document.getElementById('scan-btn'),
    statusMessage: document.getElementById('status-message'),
    scanLog: document.getElementById('scan-log'),
    logContent: document.getElementById('log-content'),
    themeToggle: document.getElementById('theme-toggle')
};

// ============================================================================
// State Management
// ============================================================================
const state = {
    filesContent: [], // Array of { name, file } objects
    logs: [], // Array of log messages
    isScanning: false, // Scanning status
    theme: localStorage.getItem('theme') || 'light' // Theme preference
};

// ============================================================================
// Regex Patterns for Privacy Detection
// ============================================================================
const patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(\+\d{1,3}[-.\s]?)?(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s*\d{3}[-.\s]?\d{4})\b/g,
    id: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g, // SSN or similar
    address: /\b\d{1,5}\s[A-Za-z\s]+?(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Ln|Lane)\b/gi
};

// ============================================================================
// Utility Functions
// ============================================================================
const utils = {
    /**
     * Logs a message to the UI and console
     * @param {string} message - Log message
     * @param {string} type - Log type (info, warn, error)
     */
    log: (message, type = 'info') => {
        const timestamp = new Date().toISOString();
        state.logs.push(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
        DOM.logContent.textContent = state.logs.slice(-50).join('\n');
        DOM.scanLog.classList.remove('hidden');
        console[type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'log'](`[${type}] ${message}`);
    },

    /**
     * Displays a status message to the user
     * @param {string} message - Status message
     * @param {string} type - Message type (info, success, error)
     */
    showStatus: (message, type = 'info') => {
        DOM.statusMessage.textContent = message;
        DOM.statusMessage.className = `mt-4 text-sm ${
            type === 'error' ? 'text-red-600' :
            type === 'success' ? 'text-green-600' :
            'text-gray-500 dark:text-gray-400'
        }`;
    },

    /**
     * Escapes HTML to prevent XSS
     * @param {string} str - Input string
     * @returns {string} Escaped string
     */
    escapeHTML: (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Checks if File API is supported
     * @returns {boolean}
     */
    isFileAPISupported: () => {
        return window.File && window.FileReader && window.FileList && window.Blob;
    }
};

// ============================================================================
// Theme Management
// ============================================================================
const themeManager = {
    /**
     * Initializes the theme
     */
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

    /**
     * Toggles theme
     */
    toggle: () => {
        document.body.classList.toggle('dark');
        state.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
        DOM.themeToggle.querySelector('img').src = state.theme === 'dark' ? 'assets/icons/sun.svg' : 'assets/icons/moon.svg';
        localStorage.setItem('theme', state.theme);
        utils.log(`Switched to ${state.theme} theme`);
    }
};

// ============================================================================
// File Handling
// ============================================================================
const fileHandler = {
    validTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg'
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB

    /**
     * Handles file uploads
     * @param {FileList} files - Files to process
     */
    handleFiles: async (files) => {
        utils.log('handleFiles called');
        if (!utils.isFileAPISupported()) {
            utils.showStatus('File API not supported in this browser', 'error');
            utils.log('File API not supported', 'error');
            return;
        }

        if (!files || files.length === 0) {
            utils.showStatus('No files selected', 'error');
            utils.log('No files selected', 'error');
            return;
        }

        utils.log(`Processing ${files.length} file(s)`);
        const newFiles = Array.from(files).filter(file => 
            !state.filesContent.some(f => f.name === file.name && f.file.size === file.size)
        );

        if (newFiles.length === 0) {
            utils.showStatus('All selected files are already uploaded', 'error');
            utils.log('Duplicate files rejected', 'warn');
            return;
        }

        for (const file of newFiles) {
            try {
                utils.log(`Validating file: ${file.name}`);
                if (!fileHandler.validTypes.includes(file.type)) {
                    utils.showStatus(`Unsupported file type: ${file.name}`, 'error');
                    utils.log(`Rejected file ${file.name}: Invalid type ${file.type}`, 'error');
                    continue;
                }
                if (file.size > fileHandler.maxFileSize) {
                    utils.showStatus(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`, 'error');
                    utils.log(`Rejected file ${file.name}: Size ${file.size} exceeds ${fileHandler.maxFileSize}`, 'error');
                    continue;
                }
                state.filesContent.push({ name: file.name, file });
                DOM.fileList.insertAdjacentHTML('beforeend', `
                    <div class="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded transition">
                        <span class="text-sm text-gray-600 dark:text-gray-300">${utils.escapeHTML(file.name)}</span>
                        <button class="remove-file text-red-600 hover:text-red-700 p-1" data-name="${utils.escapeHTML(file.name)}" aria-label="Remove file">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>`);
                utils.log(`Added file: ${file.name}`);
            } catch (err) {
                utils.showStatus(`Error processing ${file.name}: ${err.message}`, 'error');
                utils.log(`Error processing ${file.name}: ${err.message}`, 'error');
            }
        }

        DOM.scanBtn.disabled = state.filesContent.length === 0;
        utils.showStatus(
            state.filesContent.length > 0 
                ? `${state.filesContent.length} file(s) ready to scan` 
                : 'No files selected', 
            state.filesContent.length > 0 ? 'success' : 'info'
        );
        fileHandler.bindRemoveButtons();
    },

    /**
     * Binds remove file buttons
     */
    bindRemoveButtons: () => {
        utils.log('Binding remove buttons');
        const buttons = document.querySelectorAll('.remove-file');
        buttons.forEach(button => {
            // Remove existing listeners to prevent duplicates
            button.removeEventListener('click', button._handler);
            button._handler = () => {
                const name = button.dataset.name;
                state.filesContent = state.filesContent.filter(f => f.name !== name);
                button.parentElement.remove();
                DOM.scanBtn.disabled = state.filesContent.length === 0;
                utils.log(`Removed file: ${name}`);
                utils.showStatus(
                    state.filesContent.length > 0 
                        ? `${state.filesContent.length} file(s) ready to scan` 
                        : 'No files selected', 
                    state.filesContent.length > 0 ? 'success' : 'info'
                );
            };
            button.addEventListener('click', button._handler);
        });
    },

    /**
     * Reads file content (simplified)
     * @param {File} file - File to read
     * @returns {Promise<string>} Extracted text
     */
    readFile: async (file) => {
        return new Promise((resolve, reject) => {
            utils.log(`Reading file: ${file.name}`);
            if (file.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(e.target.result);
                    utils.log(`Read TXT: ${file.name}`);
                };
                reader.onerror = () => reject('FileReader error');
                reader.readAsText(file);
            } else {
                resolve('Sample text'); // Placeholder for PDF, DOCX, images
                utils.log(`Simulated read for ${file.name}`);
            }
        });
    }
};

// ============================================================================
// Scanner Logic
// ============================================================================
const scanner = {
    /**
     * Scans content for sensitive data
     * @param {string} content - Text to scan
     * @returns {Object} Scan results
     */
    scanContent: (content) => {
        utils.log('Scanning content');
        const result = { emails: [], phones: [], ids: [], addresses: [] };
        for (const [type, pattern] of Object.entries(patterns)) {
            const matches = content.match(pattern) || [];
            result[type] = matches.map(match => ({ value: match, risk: 'high' }));
        }
        utils.log('Content scan completed');
        return result;
    }
};

// ============================================================================
// Event Listeners
// ============================================================================
const initEvents = () => {
    utils.log('Initializing event listeners');
    
    // Theme Toggle
    DOM.themeToggle.addEventListener('click', () => {
        themeManager.toggle();
    });

    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave'].forEach(event => {
        DOM.dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (event === 'dragover' || event === 'dragenter') {
                DOM.dropZone.classList.add('border-blue-600', 'bg-blue-50', 'dark:bg-gray-700');
            } else {
                DOM.dropZone.classList.remove('border-blue-600', 'bg-blue-50', 'dark:bg-gray-700');
            }
        });
    });

    DOM.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.dropZone.classList.remove('border-blue-600', 'bg-blue-50', 'dark:bg-gray-700');
        utils.log('Drop event triggered');
        fileHandler.handleFiles(e.dataTransfer.files);
    });

    // File Input
    DOM.dropZone.addEventListener('click', (e) => {
        e.preventDefault();
        utils.log('Drop zone clicked');
        DOM.fileInput.click();
    });

    // Clear existing listeners to prevent duplicates
    DOM.fileInput.removeEventListener('change', fileHandler.handleFiles);
    DOM.fileInput.addEventListener('change', (e) => {
        utils.log('File input change event');
        fileHandler.handleFiles(e.target.files);
    });

    // Scan Button (simplified)
    DOM.scanBtn.addEventListener('click', async () => {
        if (state.filesContent.length === 0 || state.isScanning) return;
        state.isScanning = true;
        DOM.scanBtn.disabled = true;
        utils.log('Starting scan');
        utils.showStatus('Scanning...', 'info');

        for (const { name, file } of state.filesContent) {
            try {
                const content = await fileHandler.readFile(file);
                const result = scanner.scanContent(content);
                utils.log(`Scanned ${name}: ${JSON.stringify(result)}`);
            } catch (err) {
                utils.showStatus(`Error scanning ${name}: ${err}`, 'error');
                utils.log(`Error scanning ${name}: ${err}`, 'error');
            }
        }

        state.isScanning = false;
        DOM.scanBtn.disabled = state.filesContent.length === 0;
        utils.showStatus('Scan completed', 'success');
    });
};

// ============================================================================
// Initialization
// ============================================================================
const init = () => {
    utils.log('ScanShield initializing');
    themeManager.init();
    initEvents();
    utils.log('ScanShield initialized');
    utils.showStatus('Ready to scan files');
};

document.addEventListener('DOMContentLoaded', init);
