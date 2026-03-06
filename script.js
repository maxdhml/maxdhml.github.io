/* ───────────────────────────────────────────────
   Translations FR / EN
─────────────────────────────────────────────── */
const translations = {
    fr: {
        "profile-sub": "Portfolio & writeups",
        "nav-writeup": "Write Up",
        "nav-portfolio": "Portfolio",
        "nav-contacts": "Contacts",
        "nav-about": "About",
        "section-writeup": "Write Up",
        "section-portfolio": "Portfolio & Projets",
        "section-contacts": "Contacts",
        "section-about": "About Me",
        "contact-intro": "Vous pouvez me contacter via les plateformes suivantes :",
        "contact-email-desc": "max.dhml@gmail.com",
        "contact-linkedin-desc": "Me contacter sur LinkedIn",
        "contact-github-desc": "Voir mes dépôts",
        "about-p1": "Étudiant en Réseaux & Télécommunications avec un fort intérêt pour la cybersécurité.",
        "about-p2": "Focalisé sur la compréhension des systèmes internes et des infrastructures réseau pour améliorer la sécurité.",
        "about-p3": "Expérimenté avec les environnements Linux, les fondamentaux réseau et les challenges CTF. En développement continu de compétences pratiques à travers des projets concrets.",
        "writeup-desc-thm": "Collection de solutions et walkthroughs TryHackMe CTF.",
        "writeup-desc-ywh": "Rapports et découvertes de bug bounty sur YesWeHack.",
        "project-desc-r36s": "Construction d'un lecteur MP3 style iPod sur la console Linux R36S.",
        "project-desc-c2": "Framework de Command and Control pour tests.",
        "btn-lang-label": "🇬🇧 EN",
        "footer": "© 2026 maxdhml",
        "banner": "🟢 En recherche d'alternance \u2014 <a href='CV Maxime DUHAMEL - Alternance.pdf' download>voir mon CV</a>",
        "section-certifications": "Certifications",
        "cert-status-progress": "En cours",
        "cert-status-pending": "En attente"
    },
    en: {
        "profile-sub": "Portfolio & writeups",
        "nav-writeup": "Write Up",
        "nav-portfolio": "Portfolio",
        "nav-contacts": "Contacts",
        "nav-about": "About",
        "section-writeup": "Write Up",
        "section-portfolio": "Portfolio & Projects",
        "section-contacts": "Contacts",
        "section-about": "About Me",
        "contact-intro": "You can reach me through the following platforms:",
        "contact-email-desc": "max.dhml@gmail.com",
        "contact-linkedin-desc": "Connect on LinkedIn",
        "contact-github-desc": "Check my repositories",
        "about-p1": "Computer Networks & Telecommunications student with a strong interest in cybersecurity.",
        "about-p2": "Focused on understanding system internals and network infrastructures to improve security.",
        "about-p3": "Experienced with Linux environments, networking fundamentals, and CTF challenges. Continuously developing practical skills through hands-on projects.",
        "writeup-desc-thm": "Collection of TryHackMe CTF solutions and walkthroughs.",
        "writeup-desc-ywh": "Bug bounty reports and findings from YesWeHack.",
        "project-desc-r36s": "Building an iPod-style MP3 player from scratch on the R36S Linux console.",
        "project-desc-c2": "Command and Control testing framework.",
        "btn-lang-label": "🇫🇷 FR",
        "footer": "© 2026 maxdhml",
        "banner": "🟢 Looking for an apprenticeship \u2014 <a href='CV Maxime DUHAMEL - Alternance.pdf' download>view my CV</a>",
        "section-certifications": "Certifications",
        "cert-status-progress": "In progress",
        "cert-status-pending": "Pending"
    }
};

/* ───────────────────────────────────────────────
   Language Engine
─────────────────────────────────────────────── */
function getCurrentLang() {
    return localStorage.getItem('lang') || 'fr';
}

function applyLanguage(lang) {
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key] !== undefined) {
            if (key === 'banner') {
                el.innerHTML = t[key];
            } else {
                el.textContent = t[key];
            }
        }
    });
}

function toggleLanguage() {
    const newLang = getCurrentLang() === 'fr' ? 'en' : 'fr';
    applyLanguage(newLang);
    // Re-render dynamic cards so descriptions update
    renderCards(writeups, 'writeups-list');
    renderCards(projects, 'projects-list');
}

/* ───────────────────────────────────────────────
   Cards
─────────────────────────────────────────────── */
const writeups = [
    { title: "TryHackMe CTF Write Ups", descKey: "writeup-desc-thm", url: "write-ups/TryHackMe%20CTF%20Write%20Ups/index.html" },
    { title: "YesWeHack Write Ups", descKey: "writeup-desc-ywh", url: "write-ups/YesWeHack%20Write%20Ups/index.html" }
];

const projects = [
    { title: "R36S Mp3 Player - Ipod Design", descKey: "project-desc-r36s", url: "#" },
    { title: "Custom C2 Framework", descKey: "project-desc-c2", url: "#" }
];

function renderCards(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const lang = getCurrentLang();
    const t = translations[lang];
    container.innerHTML = '';
    data.forEach(item => {
        const li = document.createElement('li');
        li.className = 'writeup-card';
        li.setAttribute('role', 'link');
        li.setAttribute('tabindex', '0');
        li.setAttribute('aria-label', item.title);

        const navigate = () => {
            if (item.url === '#') return;
            window.location.href = item.url;
        };

        li.addEventListener('click', navigate);
        li.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate();
            }
        });

        li.innerHTML = `
            <div class="card-content">
                <div class="card-title">${item.title}</div>
                <div class="card-desc" data-i18n="${item.descKey}">${t[item.descKey] || ''}</div>
            </div>
        `;
        container.appendChild(li);
    });
}

/* ───────────────────────────────────────────────
   Hamburger menu
─────────────────────────────────────────────── */
function initHamburger() {
    const btn = document.getElementById('hamburger-btn');
    const nav = document.getElementById('nav-menu');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('nav-open');
        btn.classList.toggle('is-active', isOpen);
        btn.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu on link click (mobile)
    nav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            nav.classList.remove('nav-open');
            btn.classList.remove('is-active');
            btn.setAttribute('aria-expanded', 'false');
        });
    });
}

/* ───────────────────────────────────────────────
   Keyboard accessibility for contact cards
─────────────────────────────────────────────── */
function initContactCards() {
    document.querySelectorAll('.writeup-card[onclick]').forEach(card => {
        card.setAttribute('role', 'link');
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
}

/* ───────────────────────────────────────────────
   Init
─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(getCurrentLang());
    renderCards(writeups, 'writeups-list');
    renderCards(projects, 'projects-list');
    initHamburger();
    initContactCards();
});
