const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');
const utilsDir = path.join(__dirname, 'utils');

function getFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files);
        } else if (name.endsWith('.tsx') || name.endsWith('.ts')) {
            files.push(name);
        }
    }
    return files;
}

const files = [...getFiles(componentsDir), ...getFiles(utilsDir)];

let updatedFilesCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // We replace instances of `.toLocaleString('fr-FR', { ... })` and similar
    // with `.toLocaleString('en-US', { ... }).replace(/,/g, '\u202F').replace(/\./g, ',')`

    // First, let's target the exact string pattern we generated:
    // .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    // Some were 'es-CR' before we converted, or 'en-US'. We will just search for all toLocaleString
    // with fr-FR or en-US or es-CR that have minimumFractionDigits.

    // Regex explanation: look for `.toLocaleString('...', { ... })`
    // We want to append `.replace(/,/g, '\u202F').replace(/\./g, ',')` if it's not already there.
    const pattern = /\.toLocaleString\(['"](?:fr-FR|en-US|es-CR)['"](?:,\s*\{[^}]+\})?\)/g;

    content = content.replace(pattern, (match) => {
        // Find if this is inside an existing replace block so we don't duplicate
        // But since we are replacing the exact pattern, if it already had .replace(), the match would just be the toLocaleString part.
        // We will generate the base en-US first.
        let innerMatch = match.replace(/['"](?:fr-FR|en-US|es-CR)['"]/, "'en-US'");
        return innerMatch + `.replace(/,/g, '\\u202F').replace(/\\./g, ',')`;
    });

    // Cleanup potential duplications if we re-run
    content = content.replace(/\.replace\(\/,\/g, '\\u202F'\)\.replace\(\/\\\.\/g, ','\)\.replace\(\/,\/g, '\\u202F'\)\.replace\(\/\\\.\/g, ','\)/g, `.replace(/,/g, '\\u202F').replace(/\\./g, ',')`);

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        updatedFilesCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Refactored ${updatedFilesCount} files to use bulletproof space formatting.`);
