const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    printReceipt: (data) => ipcRenderer.send('print-receipt', data),
    printLabel: (data) => ipcRenderer.send('print-label', data),
    isElectron: true
});
