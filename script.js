const writeups = [
    {
        title: "TryHackMe CTF Write Ups",
        description: "Collection of TryHackMe CTF solutions and walkthroughs.",
        url: "write-ups/TryHackMe CTF Write Ups/index.html"
    },
    {
        title: "YesWeHack Write Ups",
        description: "Bug bounty reports and findings from YesWeHack.",
        url: "write-ups/YesWeHack Write Ups/index.html"
    }
];

const projects = [
    {
        title: "R36S Mp3 Player - Ipod Design",
        description: "Building an iPod-style MP3 player from scratch on the R36S Linux console.",
        url: "#"
    },
    {
        title: "Custom C2 Framework",
        description: "Command and Control testing framework.",
        url: "#"
    }
];

function renderCards(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return; // Exit if container doesn't exist on this page

    container.innerHTML = '';

    data.forEach(item => {
        const li = document.createElement('li');
        li.className = 'writeup-card';
        li.onclick = () => window.location.href = item.url;

        li.innerHTML = `
            <div class="card-title">${item.title}</div>
            <div class="card-desc">${item.description}</div>
        `;

        container.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Only tries to render if the element exists
    renderCards(writeups, 'writeups-list');
    renderCards(projects, 'projects-list');

    // Language toggle initialization
    var btnText = document.getElementById('lang-text');
    if (btnText) {
        btnText.classList.add('notranslate');
        var isEnglish = document.cookie.indexOf('googtrans=/fr/en') !== -1 || document.cookie.indexOf('googtrans=/auto/en') !== -1;
        btnText.innerText = isEnglish ? 'EN' : 'FR';
    }
});

function toggleLanguage() {
    var isEnglish = document.cookie.indexOf('googtrans=/fr/en') !== -1 || document.cookie.indexOf('googtrans=/auto/en') !== -1;
    var domain = window.location.hostname || '';

    // Clear existing cookies to ensure override
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    if (domain) {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
    }

    if (isEnglish) {
        // Switch back to French (original)
        document.cookie = `googtrans=/fr/fr; path=/;`;
        if (domain) document.cookie = `googtrans=/fr/fr; path=/; domain=${domain}`;
    } else {
        // Switch to English
        document.cookie = `googtrans=/fr/en; path=/;`;
        if (domain) document.cookie = `googtrans=/fr/en; path=/; domain=${domain}`;
    }

    var combo = document.querySelector('.goog-te-combo');
    if (combo) {
        combo.value = isEnglish ? 'fr' : 'en';
        combo.dispatchEvent(new Event('change'));

        var btnText = document.getElementById('lang-text');
        if (btnText) {
            btnText.innerText = isEnglish ? 'FR' : 'EN';
        }
    } else {
        // Fallback: reload the page to apply the cookie
        window.location.reload();
    }
}

// Append Google Translate script
const gtDiv = document.createElement('div');
gtDiv.id = 'google_translate_element';
gtDiv.style.display = 'none';
document.body.appendChild(gtDiv);

window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement({
        pageLanguage: 'fr',
        includedLanguages: 'en,fr',
        autoDisplay: false
    }, 'google_translate_element');
};

const gtScript = document.createElement('script');
gtScript.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
document.body.appendChild(gtScript);
