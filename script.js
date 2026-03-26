/* ───────────────────────────────────────────────
   Cards
─────────────────────────────────────────────── */
const writeups = [
    { title: "TryHackMe CTF Write Ups", desc: "Collection de solutions et walkthroughs TryHackMe CTF.", url: "write-ups/TryHackMe%20CTF%20Write%20Ups/index.html" },
    { title: "YesWeHack Write Ups", desc: "Rapports et découvertes de bug bounty sur YesWeHack.", url: "write-ups/YesWeHack%20Write%20Ups/index.html" }
];

const projects = [];

function renderCards(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
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
                <div class="card-desc">${item.desc || ''}</div>
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
    renderCards(writeups, 'writeups-list');
    renderCards(projects, 'projects-scolaire-list');
    renderCards(projects, 'projects-personnel-list');
    initHamburger();
    initContactCards();
});
