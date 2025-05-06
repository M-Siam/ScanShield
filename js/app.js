const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const scanBtn = document.getElementById('scan-btn');
const sanitizeBtn = document.getElementById('sanitize-btn');
const progressBar = document.getElementById('progress-bar');
const results = document.getElementById('results');
const privacyScore = document.getElementById('privacy-score');
const scoreText = document.getElementById('score-text');
const scoreBreakdown = document.getElementById('score-breakdown');
const metadataSection = document.getElementById('metadata');
const metadataList = document.getElementById('metadata-list');
const beforeContent = document.getElementById('before-content');
const afterContent = document.getElementById('after-content');
const exportTxt = document.getElementById('export-txt');
const exportPdf = document.getElementById('export-pdf');
const themeToggle = document.getElementById('theme-toggle');
const languageSelect = document.getElementById('language-select');

let filesContent = [];
let scanResults = [];
let sanitizedContent = '';

// Regex Patterns (English by default)
const patterns = {
    en: {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b(\+\d{1,3}[-.\s]?)?(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s*\d{3}[-.\s]?\d{4})\b/g,
        id: /\b\d{3}-\d{2}-\d{4}\b/g, // SSN-like
        address: /\b\d{1,5}\s[A-Za-z\s]+(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road)\b/g,
        url: /\b(https?:\/\/)?(bit\.ly|t\.co|utm_\S+|[A-Za-z0-9-]+\.[a-z]{2,3}\/\S+)\b/g,
        keywords: /\b(salary|bank|home|dob)\b/gi
    }
    // Add more languages as needed
};

const riskWeights = {
    email: 10,
    phone: 15,
    id: 20,
    address: 8,
    url: 5,
    keywords: 5
};

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    themeToggle.querySelector('img').src = isDark ? 'assets/icons/sun.svg' : 'assets/icons/moon.svg';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Load Theme
if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark');
    themeToggle.querySelector('img').src = 'assets/icons/sun.svg';
}

// Drag and Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900');
    handleFiles(e.dataTransfer.files);
});

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => handleFiles(fileInput.files));

// Handle Files
async function handleFiles(files) {
    filesContent = [];
    scanResults = [];
    for (const file of files) {
        const content = await readFile(file);
        filesContent.push({ name: file.name, content, metadata: await extractMetadata(file) });
    }
    scanBtn.disabled = false;
}

// Read File
async function readFile(file) {
    return new Promise((resolve, reject) => {
        if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const typedArray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => item.str).join(' ') + '\n';
                }
                resolve(text);
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
                resolve(result.value);
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsText(file);
        } else {
            reject('Unsupported file type');
        }
    });
}

// Extract Metadata
async function extractMetadata(file) {
    const metadata = {};
    if (file.type === 'application/pdf') {
        const reader = new FileReader();
        return new Promise((resolve) => {
            reader.onload = async (e) => {
                const typedArray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                const meta = await pdf.getMetadata();
                metadata.author = meta.info.Author || 'Unknown';
                metadata.created = meta.info.CreationDate || 'Unknown';
                resolve(metadata);
            };
            reader.readAsArrayBuffer(file);
        });
    }
    return metadata;
}

// Scan Files
scanBtn.addEventListener('click', async () => {
    progressBar.classList.remove('hidden');
    let progress = 0;
    const increment = 100 / filesContent.length;

    for (const file of filesContent) {
        const result = scanContent(file.content);
        scanResults.push({ name: file.name, result, metadata: file.metadata });
        progress += increment;
        progressBar.querySelector('div').style.width = `${progress}%`;
    }

    setTimeout(() => {
        progressBar.classList.add('hidden');
        displayResults();
    }, 500);
});

// Scan Content
function scanContent(content) {
    const lang = languageSelect.value;
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
        result[type] = matches.map(match => ({ value: match, risk: type === 'email' || type === 'phone' || type === 'id' ? 'high' : type === 'address' || type === 'keywords' ? 'medium' : 'low' }));
    }

    return result;
}

// Display Results
function displayResults() {
    results.classList.add('fade-in');
    let totalFindings = 0;
    let score = 100;

    scanResults.forEach(fileResult => {
        const { result, metadata } = fileResult;

        // Privacy Score
        let fileFindings = 0;
        for (const [type, matches] of Object.entries(result)) {
            fileFindings += matches.length;
            score -= matches.length * riskWeights[type];
        }
        totalFindings += fileFindings;

        // Metadata
        if (Object.keys(metadata).length) {
            metadataSection.classList.remove('hidden');
            metadataList.innerHTML = Object.entries(metadata).map(([key, value]) => `<li>${key}: ${value}</li>`).join('');
        }

        // Content
        let content = fileResult.content;
        for (const [type, matches] of Object.entries(result)) {
            matches.forEach(match => {
                const className = match.risk === 'high' ? 'high-risk' : match.risk === 'medium' ? 'medium-risk' : 'safe';
                const tooltip = match.risk === 'high' ? 'Sharing this may lead to privacy risks.' : 'Consider removing this.';
                content = content.replace(match.value, `<span class="${className}" data-tooltip="${tooltip}">${match.value}</span>`);
            });
        }
        beforeContent.innerHTML += `<h5 class="font-medium mt-4">${fileResult.name}</h5><p>${content}</p>`;
    });

    // Privacy Score
    score = Math.max(0, score);
    const riskLevel = score < 40 ? 'High' : score < 70 ? 'Medium' : 'Low';
    privacyScore.classList.remove('hidden');
    scoreText.textContent = `${score}/100 (${riskLevel} Risk)`;
    scoreBreakdown.innerHTML = scanResults.flatMap(file => Object.entries(file.result).map(([type, matches]) => `<p>${type}: ${matches.length}</p>`)).join('');

    // Show Sanitize and Export
    sanitizeBtn.classList.remove('hidden');
    document.getElementById('scan-content').classList.remove('hidden');
    document.getElementById('export-options').classList.remove('hidden');
}

// Sanitize Content
sanitizeBtn.addEventListener('click', () => {
    sanitizedContent = filesContent.map(file => {
        let content = file.content;
        scanResults.find(r => r.name === file.name).result.emails.forEach(m => content = content.replace(m.value, '[REDACTED]'));
        scanResults.find(r => r.name === file.name).result.phones.forEach(m => content = content.replace(m.value, '[REDACTED]'));
        scanResults.find(r => r.name === file.name).result.ids.forEach(m => content = content.replace(m.value, '[REDACTED]'));
        return `<h5 class="font-medium mt-4">${file.name}</h5><p>${content}</p>`;
    }).join('');
    afterContent.innerHTML = sanitizedContent;
});

// Export as TXT
exportTxt.addEventListener('click', () => {
    const blob = new Blob([sanitizedContent.replace(/<[^>]+>/g, '')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sanitized.txt';
    a.click();
    URL.revokeObjectURL(url);
});

// Export as PDF (Basic HTML to PDF)
exportPdf.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('ScanShield Sanitized Output', 10, 10);
    let y = 20;
    scanResults.forEach(file => {
        doc.text(file.name, 10, y);
        y += 10;
        doc.text(file.content.substring(0, 100), 10, y);
        y += 10;
    });
    doc.save('sanitized.pdf');
});