#!/usr/bin/env node
/**
 * generate-index.js
 * 
 * Scanne les dossiers write-ups/ et projects/ pour trouver les fichiers .md,
 * et génère les articles.json correspondants.
 * 
 * Usage : node generate-index.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Dossiers à scanner
const SCAN_DIRS = [
    'write-ups/TryHackMe CTF Write Ups',
    'write-ups/YesWeHack Write Ups',
    'projects/personnel',
    'projects/scolaire',
];

/**
 * Nettoie une ligne de description Markdown :
 * - Supprime les images Markdown (![...](...)  y compris les data:image base64)
 * - Convertit les liens Markdown [text](url) en texte seul
 * - Tronque à MAX_DESC_LENGTH caractères
 */
const MAX_DESC_LENGTH = 200;

function cleanDesc(raw) {
    let cleaned = raw;
    // Supprimer les images Markdown: ![alt](src)
    cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
    // Convertir les liens [text](url) → text
    cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    // Supprimer les espaces multiples
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    // Tronquer si trop long
    if (cleaned.length > MAX_DESC_LENGTH) {
        cleaned = cleaned.substring(0, MAX_DESC_LENGTH).trim() + '…';
    }
    return cleaned;
}

/**
 * Extrait le titre et la description d'un fichier Markdown.
 * - Titre = premier heading # ...
 * - Description = premier paragraphe non vide après le titre (nettoyé)
 */
function extractMeta(content) {
    const lines = content.split('\n');
    let title = '';
    let desc = '';
    let foundTitle = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Chercher le titre (premier # heading)
        if (!foundTitle && /^#\s+/.test(trimmed)) {
            title = trimmed.replace(/^#\s+/, '').trim();
            foundTitle = true;
            continue;
        }

        // Une fois le titre trouvé, chercher le premier paragraphe non vide
        if (foundTitle && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```') && !trimmed.startsWith('---')) {
            const candidate = cleanDesc(trimmed);
            // Ignorer les lignes qui sont uniquement des images (description vide après nettoyage)
            if (candidate) {
                desc = candidate;
                break;
            }
        }
    }

    return { title: title || 'Sans titre', desc };
}

/**
 * Génère un slug depuis le nom de fichier (sans extension).
 */
function fileToSlug(filename) {
    return path.basename(filename, '.md');
}

/**
 * Scanne un dossier et génère son articles.json.
 */
function processDirectory(dirRelative) {
    const dirAbsolute = path.join(ROOT, dirRelative);

    if (!fs.existsSync(dirAbsolute)) {
        console.log(`⏭️  Dossier inexistant, ignoré : ${dirRelative}`);
        return;
    }

    const files = fs.readdirSync(dirAbsolute)
        .filter(f => f.endsWith('.md') && f !== 'README.md')
        .sort();

    const articles = files.map(file => {
        const content = fs.readFileSync(path.join(dirAbsolute, file), 'utf-8');
        const meta = extractMeta(content);
        const stat = fs.statSync(path.join(dirAbsolute, file));

        return {
            slug: fileToSlug(file),
            title: meta.title,
            desc: meta.desc,
            date: stat.mtime.toISOString(),
            file: file,
        };
    });

    // Trier par date (plus récent en premier)
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Écrire articles.json
    const jsonPath = path.join(dirAbsolute, 'articles.json');
    fs.writeFileSync(jsonPath, JSON.stringify(articles, null, 2), 'utf-8');

    console.log(`✅ ${dirRelative}/articles.json → ${articles.length} article(s)`);
    articles.forEach(a => console.log(`   📄 ${a.file} → "${a.title}"`));
}

// ─── Main ───
console.log('🔍 Scanning des dossiers...\n');

SCAN_DIRS.forEach(dir => processDirectory(dir));

console.log('\n🎉 Terminé ! N\'oublie pas de faire un git push.');
