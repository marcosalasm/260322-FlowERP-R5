const fs = require('fs');
const glob = require('glob');
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

    // Change all 'en-US' locale strings to 'fr-FR' to comply with:
    // "Separador de miles: espacio fino. Decimales: coma"
    content = content.replace(/'en-US'/g, "'fr-FR'");

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        updatedFilesCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Refactored ${updatedFilesCount} files to use fr-FR.`);
