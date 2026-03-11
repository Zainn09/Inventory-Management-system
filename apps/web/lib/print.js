export const isElectron = typeof window !== 'undefined' && window.electron?.isElectron;

export function printReceipt(order) {
    if (isElectron) {
        window.electron.printReceipt(order);
    } else {
        // Fallback: Open print dialog for a specific element
        window.print();
    }
}

export function printLabel(product) {
    if (isElectron) {
        window.electron.printLabel(product);
    } else {
        // Fallback: Show a modal with printable label
        alert('Printing label for ' + product.sku);
        window.print();
    }
}
