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
});
