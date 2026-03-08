const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'components');

function getFiles(dir, files = []) {
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

const files = getFiles(srcDir);
let updatedFilesCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // 1. Fix existing local formatCurrency implementations to use en-US or better formatting
    content = content.replace(/const formatCurrency \= \(.*?\).*?\=>(?:[^`]*?)`[¢\$]\$\{([A-Za-z0-9_\.\(\)]+?)\.toLocaleString\([^)]+\)\}`[;]?/g,
        (match, varName) => `const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return \`¢\${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`; };`
    );

    content = content.replace(/const formatCurrency \= \(.*?\).*?\{[\s\S]*?return[^`]*?`[¢\$]\$\{([A-Za-z0-9_\.\(\)]+?)\.toLocaleString\([^)]+\)\}`[;]?[\s\S]*?\}/g,
        (match, varName) => `const formatCurrency = (value: number) => { const num = Number(value); if (isNaN(num)) return '¢0.00'; return \`¢\${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`; };`
    );

    // 2. Fix edit budget modal formatCurrencyValue
    content = content.replace(/const formatCurrencyValue = \(value: number\) => \{[\s\S]*?return `\$\{parts\[0\]\},\$\{parts\[1\]\}`;[\s\S]*?\};/gs,
        `const formatCurrencyValue = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};`);

    content = content.replace(/const formatCurrencyValue = \(value: number\) => \{[^}]+parts\[0\]\s*=\s*parts\[0\]\.replace\([^)]+\);\s*return\s*montoFormateado;[\s\S]*?\}/gs,
        `const formatCurrencyValue = (value: number) => {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}`);

    // Fix other formatters that might use string replacement
    content = content.replace(/const formatNumber = \(num: number\) => num.toLocaleString\([^)]+\);/g,
        `const formatNumber = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });`);

    // 3. Format raw quantities rendered in JSX elements.
    const keywords = ['amount', 'Total', 'quantity', 'Quantity', 'price', 'Price', 'cost', 'Cost', 'budget', 'Budget', 'subtotal', 'Subtotal', 'tax', 'Tax', 'gastos', 'Gastos', 'expenses', 'Expenses', 'income', 'Income', 'qty', 'Qty', 'monto', 'Monto', 'precio', 'Precio', 'pago', 'Pago'];

    // Create regex that matches any of these words inside a variable path (e.g. item.quantityOrdered)
    const keywordPattern = keywords.join('|');
    const jsxRegex = new RegExp(`>\\s*\\{([A-Za-z0-9_\\.]*(?:${keywordPattern})[A-Za-z0-9_\\.]*)\\}\\s*<`, 'g');

    content = content.replace(jsxRegex, (match, expression) => {
        if (expression.includes('(') || expression.includes(')')) return match;
        if (expression.includes('Date') || expression.includes('Time') || expression.includes('Id') || expression.includes('Name')) return match;
        if (expression.endsWith('Status') || expression.endsWith('Category')) return match;
        if (expression.startsWith('set')) return match;

        // Ensure we don't break string rendering
        return `>{Number(${expression}).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<`;
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        updatedFilesCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Refactored ${updatedFilesCount} files.`);
