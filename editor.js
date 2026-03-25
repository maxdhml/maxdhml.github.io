/* ═══════════════════════════════════════════════════
   Editor — Enhanced Security + CRUD + Quill.js
═══════════════════════════════════════════════════ */

/* ─── Security Config ─── */
// Password: "maxdhml2026" — Change the hash below to use a different password.
// To generate a new hash, run in browser console:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_PASSWORD'))
//     .then(h => console.log(Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('')))
const PASSWORD_HASH = '83aaecbf56aeec9540fe063eda280ef058b402da6e7eab515ca93fb2ca871520'; // password: maxdhml2026

const SECURITY = {
    MAX_ATTEMPTS: 5,
    LOCKOUT_BASE_MS: 30000,       // 30s base lockout
    LOCKOUT_MULTIPLIER: 2,        // exponential backoff
    SESSION_DURATION_MS: 3600000, // 1h session
    IDLE_TIMEOUT_MS: 900000,      // 15min idle logout
    TOKEN_KEY: 'editor_session',
    ATTEMPTS_KEY: 'editor_attempts',
    LOCKOUT_KEY: 'editor_lockout',
};

/* ─── Utility: SHA-256 hash ─── */
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ─── Generate secure session token ─── */
function generateToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ─── Auth State ─── */
let idleTimer = null;

function getAttempts() {
    const data = JSON.parse(localStorage.getItem(SECURITY.ATTEMPTS_KEY) || '{"count":0,"time":0}');
    return data;
}

function setAttempts(count) {
    localStorage.setItem(SECURITY.ATTEMPTS_KEY, JSON.stringify({ count, time: Date.now() }));
}

function getLockout() {
    return JSON.parse(localStorage.getItem(SECURITY.LOCKOUT_KEY) || '{"until":0,"level":0}');
}

function setLockout(until, level) {
    localStorage.setItem(SECURITY.LOCKOUT_KEY, JSON.stringify({ until, level }));
}

function isLockedOut() {
    const lockout = getLockout();
    if (lockout.until > Date.now()) {
        return lockout;
    }
    return null;
}

function createSession() {
    const token = generateToken();
    const session = {
        token,
        createdAt: Date.now(),
        expiresAt: Date.now() + SECURITY.SESSION_DURATION_MS,
    };
    sessionStorage.setItem(SECURITY.TOKEN_KEY, JSON.stringify(session));
    // Reset attempts on successful login
    setAttempts(0);
    setLockout(0, 0);
    return session;
}

function getSession() {
    const raw = sessionStorage.getItem(SECURITY.TOKEN_KEY);
    if (!raw) return null;
    try {
        const session = JSON.parse(raw);
        if (session.expiresAt < Date.now()) {
            destroySession();
            return null;
        }
        return session;
    } catch {
        return null;
    }
}

function destroySession() {
    sessionStorage.removeItem(SECURITY.TOKEN_KEY);
    clearIdleTimer();
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        destroySession();
        showLogin();
        showToast('Session expirée — reconnectez-vous', 'error');
    }, SECURITY.IDLE_TIMEOUT_MS);
}

function clearIdleTimer() {
    clearTimeout(idleTimer);
}

/* ─── Change destination based on category selection ─── */
document.getElementById('field-category')?.addEventListener('change', (e) => {
    const destSelect = document.getElementById('field-destination');
    if (!destSelect) return;
    if (currentTab === 'writeups') {
        const destVal = 'write-ups/' + e.target.value;
        if ([...destSelect.options].some(o => o.value === destVal)) {
            destSelect.value = destVal;
        }
    } else {
        const destVal = 'projects/' + e.target.value.toLowerCase();
        if ([...destSelect.options].some(o => o.value === destVal)) {
            destSelect.value = destVal;
        }
    }
});
async function handleLogin(password) {
    const loginError = document.getElementById('login-error');
    const loginLockout = document.getElementById('login-lockout');

    // Check lockout
    const lockout = isLockedOut();
    if (lockout) {
        const remaining = Math.ceil((lockout.until - Date.now()) / 1000);
        loginLockout.textContent = `⏳ Trop de tentatives. Réessayez dans ${remaining}s`;
        loginLockout.hidden = false;
        loginError.hidden = true;
        return false;
    }

    const hash = await sha256(password);
    if (hash === PASSWORD_HASH) {
        createSession();
        showEditor();
        return true;
    }

    // Failed attempt
    const attempts = getAttempts();
    const newCount = attempts.count + 1;
    setAttempts(newCount);

    if (newCount >= SECURITY.MAX_ATTEMPTS) {
        const lockoutData = getLockout();
        const level = (lockoutData.level || 0) + 1;
        const duration = SECURITY.LOCKOUT_BASE_MS * Math.pow(SECURITY.LOCKOUT_MULTIPLIER, level - 1);
        setLockout(Date.now() + duration, level);
        setAttempts(0);

        const secs = Math.ceil(duration / 1000);
        loginLockout.textContent = `🔒 Compte verrouillé pendant ${secs}s`;
        loginLockout.hidden = false;
        loginError.hidden = true;

        // Start countdown
        let countdown = secs;
        const interval = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(interval);
                loginLockout.hidden = true;
            } else {
                loginLockout.textContent = `🔒 Compte verrouillé pendant ${countdown}s`;
            }
        }, 1000);
    } else {
        loginError.textContent = `❌ Mot de passe incorrect (${newCount}/${SECURITY.MAX_ATTEMPTS})`;
        loginError.hidden = false;
        loginLockout.hidden = true;
    }

    return false;
}

/* ─── UI Switching ─── */
function showLogin() {
    document.getElementById('login-screen').hidden = false;
    document.getElementById('editor-app').hidden = true;
    clearIdleTimer();
}

function showEditor() {
    document.getElementById('login-screen').hidden = true;
    document.getElementById('editor-app').hidden = false;
    resetIdleTimer();
    // Track idle
    ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
        document.addEventListener(evt, resetIdleTimer, { passive: true });
    });
    initEditorApp();
}

/* ─── Storage Keys ─── */
const STORAGE_WRITEUPS = 'editor_writeups';
const STORAGE_PROJECTS = 'editor_projects';

function loadItems(type) {
    const key = type === 'writeups' ? STORAGE_WRITEUPS : STORAGE_PROJECTS;
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
}

function saveItems(type, items) {
    const key = type === 'writeups' ? STORAGE_WRITEUPS : STORAGE_PROJECTS;
    localStorage.setItem(key, JSON.stringify(items));
}

/* ─── Quill Instance ─── */
let quill = null;

function initQuill() {
    if (quill) return;

    const modules = {
        toolbar: '#quill-toolbar',
    };

    // Only enable syntax highlighting if highlight.js is loaded
    if (typeof hljs !== 'undefined') {
        modules.syntax = { hljs: hljs };
    }

    quill = new Quill('#quill-editor', {
        theme: 'snow',
        modules: modules,
        placeholder: 'Écrivez votre contenu ici…',
    });
}

/* ─── Editor App State ─── */
let currentTab = 'writeups';
let currentItemId = null;

function initEditorApp() {
    initQuill();
    renderItemsList();
    showEmptyState();
}

/* ─── Render Items List ─── */
function renderItemsList() {
    const container = document.getElementById('items-list');
    const items = loadItems(currentTab);

    if (items.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:2rem 0.5rem;color:var(--text-secondary);font-size:0.8rem;">
                Aucun élément
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="item-entry ${item.id === currentItemId ? 'active' : ''}" data-id="${item.id}">
            <span class="item-entry-title">${escapeHtml(item.title || 'Sans titre')}</span>
            <span class="item-entry-date">${formatDate(item.createdAt)}</span>
        </div>
    `).join('');

    // Click handlers
    container.querySelectorAll('.item-entry').forEach(el => {
        el.addEventListener('click', () => {
            currentItemId = el.dataset.id;
            renderItemsList();
            loadItemIntoEditor(el.dataset.id);
        });
    });
}

/* ─── Load Item Into Editor ─── */
function loadItemIntoEditor(id) {
    const items = loadItems(currentTab);
    const item = items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('editor-empty').hidden = true;
    document.getElementById('editor-form').hidden = false;
    document.getElementById('editor-preview').hidden = true;

    document.getElementById('editor-form-title').textContent =
        currentTab === 'writeups' ? 'Éditer Write-up' : 'Éditer Projet';

    document.getElementById('field-title').value = item.title || '';
    document.getElementById('field-desc-fr').value = item.descFr || '';
    document.getElementById('field-desc-en').value = item.descEn || '';

    // Show category row for both
    document.getElementById('category-row').style.display = '';

    const catSelect = document.getElementById('field-category');
    catSelect.innerHTML = '';
    if (currentTab === 'writeups') {
        catSelect.innerHTML = `
            <option value="TryHackMe CTF Write Ups">TryHackMe CTF Write Ups</option>
            <option value="YesWeHack Write Ups">YesWeHack Write Ups</option>
            <option value="Other">Autre</option>
        `;
        catSelect.value = item.category || 'TryHackMe CTF Write Ups';
    } else {
        catSelect.innerHTML = `
            <option value="Personnel">Personnel</option>
            <option value="Scolaire">Scolaire</option>
        `;
        catSelect.value = item.category || 'Personnel';
    }

    // Show/hide destination options based on tab
    document.getElementById('dest-writeups-group').style.display =
        currentTab === 'writeups' ? '' : 'none';
    document.getElementById('dest-projects-group').style.display =
        currentTab === 'projects' ? '' : 'none';

    // Set default destination
    if (currentTab === 'writeups') {
        const cat = item.category || 'TryHackMe CTF Write Ups';
        const destVal = 'write-ups/' + cat;
        const destSelect = document.getElementById('field-destination');
        if ([...destSelect.options].some(o => o.value === destVal)) {
            destSelect.value = destVal;
        }
    } else {
        const cat = item.category || 'Personnel';
        const destVal = 'projects/' + cat.toLowerCase();
        const destSelect = document.getElementById('field-destination');
        if ([...destSelect.options].some(o => o.value === destVal)) {
            destSelect.value = destVal;
        } else {
            document.getElementById('field-destination').value = 'projects/personnel';
        }
    }

    // Load Quill content
    if (item.content) {
        quill.root.innerHTML = item.content;
    } else {
        quill.setText('');
    }
}

/* ─── Show Empty State ─── */
function showEmptyState() {
    document.getElementById('editor-empty').hidden = false;
    document.getElementById('editor-form').hidden = true;
    document.getElementById('editor-preview').hidden = true;
    currentItemId = null;
    renderItemsList();
}

/* ─── Create New Item ─── */
function createNewItem() {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const item = {
        id,
        title: '',
        descFr: '',
        descEn: '',
        content: '',
        createdAt: new Date().toISOString(),
    };

    if (currentTab === 'writeups') {
        item.category = 'TryHackMe CTF Write Ups';
    } else {
        item.category = 'Personnel';
    }

    const items = loadItems(currentTab);
    items.unshift(item);
    saveItems(currentTab, items);

    currentItemId = id;
    renderItemsList();
    loadItemIntoEditor(id);
}

/* ─── Save Current Item ─── */
function saveCurrentItem() {
    if (!currentItemId) return;

    const items = loadItems(currentTab);
    const idx = items.findIndex(i => i.id === currentItemId);
    if (idx === -1) return;

    items[idx].title = document.getElementById('field-title').value.trim();
    items[idx].descFr = document.getElementById('field-desc-fr').value.trim();
    items[idx].descEn = document.getElementById('field-desc-en').value.trim();
    items[idx].content = quill.root.innerHTML;
    items[idx].updatedAt = new Date().toISOString();

    items[idx].category = document.getElementById('field-category').value;

    saveItems(currentTab, items);
    renderItemsList();
    showToast('✅ Sauvegardé !', 'success');
}

/* ─── Delete Current Item ─── */
function deleteCurrentItem() {
    if (!currentItemId) return;
    if (!confirm('Supprimer cet élément ? Cette action est irréversible.')) return;

    const items = loadItems(currentTab);
    const filtered = items.filter(i => i.id !== currentItemId);
    saveItems(currentTab, filtered);

    showEmptyState();
    showToast('🗑️ Supprimé', 'success');
}

/* ─── Preview ─── */
function showPreview() {
    if (!currentItemId) return;
    const title = document.getElementById('field-title').value;
    const html = quill.root.innerHTML;

    document.getElementById('editor-form').hidden = true;
    document.getElementById('editor-preview').hidden = false;

    const preview = document.getElementById('preview-content');
    preview.innerHTML = `<h1>${escapeHtml(title)}</h1>${html}`;

    // Syntax highlight code blocks
    preview.querySelectorAll('pre').forEach(block => {
        hljs.highlightElement(block);
    });
}

function closePreview() {
    document.getElementById('editor-form').hidden = false;
    document.getElementById('editor-preview').hidden = true;
}

/* ─── Export as Markdown file ─── */
function exportAsMarkdown() {
    if (!currentItemId) return;

    const title = document.getElementById('field-title').value.trim() || 'Sans titre';
    const content = quill.root.innerHTML;
    const destination = document.getElementById('field-destination').value;

    // Convert HTML to Markdown using Turndown
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        emDelimiter: '*',
    });

    // Handle Quill's code blocks (they use <pre class="ql-syntax">)
    turndownService.addRule('quillCodeBlock', {
        filter: function (node) {
            return node.nodeName === 'PRE' && node.classList.contains('ql-syntax');
        },
        replacement: function (content, node) {
            return '\n```\n' + node.textContent + '\n```\n';
        }
    });

    const markdownBody = turndownService.turndown(content);
    const markdownContent = `# ${title}\n\n${markdownBody}\n`;

    // Generate filename from title
    const slug = toSlug(title);
    const filename = slug + '.md';

    // Download the file
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`📄 Fichier ${filename} téléchargé ! Place-le dans : ${destination}/`, 'success');
}

/* ─── Helper: generate slug from title ─── */
function toSlug(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/* ─── Import existing HTML article for editing ─── */
function importHtmlFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(e.target.result, 'text/html');

            // Extract title from the <article> h1 or from <title>
            const articleEl = doc.querySelector('.article-content') || doc.querySelector('article');
            if (!articleEl) {
                showToast('❌ Fichier HTML invalide : aucun contenu article trouvé', 'error');
                return;
            }

            const h1 = articleEl.querySelector('h1');
            const title = h1 ? h1.textContent.trim() : '';

            // Remove h1 and article-meta from content (we store them separately)
            if (h1) h1.remove();
            const meta = articleEl.querySelector('.article-meta');
            if (meta) meta.remove();

            const content = articleEl.innerHTML.trim();

            // Extract description from meta tag
            const metaDesc = doc.querySelector('meta[name="description"]');
            let descFr = '';
            if (metaDesc) {
                const descContent = metaDesc.getAttribute('content') || '';
                descFr = descContent.replace(/^maxdhml \u2014 /, '').trim();
                if (descFr === title) descFr = ''; // Don't duplicate
            }

            // Create a new item with the imported content
            const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
            const item = {
                id,
                title,
                descFr,
                descEn: '',
                content,
                createdAt: new Date().toISOString(),
            };

            if (currentTab === 'writeups') {
                item.category = document.getElementById('field-category')?.value || 'TryHackMe CTF Write Ups';
            }

            const items = loadItems(currentTab);
            items.unshift(item);
            saveItems(currentTab, items);

            currentItemId = id;
            renderItemsList();
            loadItemIntoEditor(id);

            showToast(`✅ Article "${title}" importé ! Modifie-le et ré-exporte.`, 'success');
        } catch (err) {
            showToast('❌ Erreur lors de l\'import : ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

/* ─── Export / Import ─── */
function exportData() {
    const data = {
        writeups: loadItems('writeups'),
        projects: loadItems('projects'),
        exportedAt: new Date().toISOString(),
        version: 1,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maxdhml-editor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📦 Données exportées !', 'success');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.writeups || !data.projects) {
                throw new Error('Format invalide');
            }

            if (!confirm(`Importer ${data.writeups.length} write-ups et ${data.projects.length} projets ?\nLes données actuelles seront remplacées.`)) {
                return;
            }

            saveItems('writeups', data.writeups);
            saveItems('projects', data.projects);
            renderItemsList();
            showEmptyState();
            showToast('✅ Données importées !', 'success');
        } catch (err) {
            showToast('❌ Fichier invalide : ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

/* ─── Toast Notification ─── */
function showToast(message, type = 'success') {
    // Remove existing
    document.querySelectorAll('.editor-toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `editor-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/* ─── Helpers ─── */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/* ═══════════════════════════════════════════════════
   Init
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // Check existing session
    if (getSession()) {
        showEditor();
    } else {
        showLogin();
    }

    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pw = document.getElementById('login-password').value;
        await handleLogin(pw);
        document.getElementById('login-password').value = '';
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        destroySession();
        showLogin();
    });

    // Tabs
    document.querySelectorAll('.editor-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            showEmptyState();
        });
    });

    // Add item
    document.getElementById('btn-add-item').addEventListener('click', createNewItem);

    // Save
    document.getElementById('btn-save').addEventListener('click', saveCurrentItem);

    // Delete
    document.getElementById('btn-delete').addEventListener('click', deleteCurrentItem);

    // Preview
    document.getElementById('btn-preview').addEventListener('click', showPreview);

    // Export Markdown
    document.getElementById('btn-export-md').addEventListener('click', exportAsMarkdown);

    document.getElementById('btn-close-preview').addEventListener('click', closePreview);

    // Export
    document.getElementById('btn-export').addEventListener('click', exportData);

    // Import JSON
    document.getElementById('btn-import').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importData(e.target.files[0]);
            e.target.value = '';
        }
    });

    // Import HTML article
    document.getElementById('btn-import-html').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importHtmlFile(e.target.files[0]);
            e.target.value = '';
        }
    });

    // Keyboard shortcut: Ctrl+S to save
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (currentItemId && !document.getElementById('editor-form').hidden) {
                saveCurrentItem();
            }
        }
    });
});
