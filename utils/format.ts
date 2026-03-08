export const formatNumber = (amount: number | string | undefined | null, minDecimals = 2, maxDecimals = 2) => {
    if (amount === undefined || amount === null) return '0.00';
    const num = Number(amount);
    if (isNaN(num)) return '0.00';

    return num.toLocaleString('en-US', {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals
    }).replace(/,/g, ' ').replace(/\./g, ',');
};

export const formatCurrency = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null) return '¢0.00';
    const num = Number(amount);
    if (isNaN(num)) return '¢0.00';
    return `¢${formatNumber(num, 2, 2)}`;
};

export const formatQuantity = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null) return '0';
    const num = Number(amount);
    if (isNaN(num)) return '0';
    return formatNumber(num, 0, 2);
};
