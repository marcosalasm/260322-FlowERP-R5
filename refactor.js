const fs = require('fs');
const glob = require('glob');
const path = require('path');

const srcDir = path.join(__dirname, 'components');
const files = glob.sync(`${srcDir}/**/*.tsx`);

let updatedFilesCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // 1. Fix existing local formatCurrency implementations to use en-US or better formatting
    // For implementations like: const formatCurrency = (value: number) => `¢${value.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
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

    // 3. Format raw quantities rendered in JSX elements. 
    // We target >{value}< or > {value} < or <td>{value}</td>
    // Regex matches > optionally space, {, optionally props/variable path containing our keywords, }, optionally space, <
    // The negative lookahead ensures we don't match if it's already wrapped in a function call like >{formatCurrency(val)}<
    const jsxRegex = />\s*\{([A-Za-z0-9_\.]*(?:amount|total|quantity|price|cost|budget|subtotal|tax|sum|value|gastos|expenses|income)[A-Za-z0-9_\.]*)\}\s*</gi;

    // We need to inject a safe formatter, but instead of adding an import to every file, we can use an inline Number().toLocaleString
    // This avoids import issues.
    content = content.replace(jsxRegex, (match, varName) => {
        // Exclude specific variables or expressions that are not simple values
        if (varName.includes('(') || varName.includes(')')) return match;
        if (varName.includes('Date') || varName.includes('Time')) return match;

        // Exclude inputs with value attribute. But this regex looks for >{...}< which is children of elements.

        return `>{Number(${varName}).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<`;
    });

    // Special case for some places where quantities are inside other braces or expressions
    // <td className="..."> {quantity} </td>
    // that is already caught by the above.

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        updatedFilesCount++;
        console.log(`Updated ${file}`);
    }
}

console.log(`Refactored ${updatedFilesCount} files.`);
