const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: 'Jewellery POS System',
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        // frame: false, // For custom titlebar later
    });

    const startURL = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../web/out/index.html')}`;

    mainWindow.loadURL(startURL);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => (mainWindow = null));

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Printer IPC Handlers
ipcMain.on('print-receipt', (event, data) => {
    console.log('Printing receipt:', data);
    // Implementation for thermal printing logic would go here
    // In Electron, we can use webContents.print() or specialized packages like 'node-thermal-printer'
    const win = new BrowserWindow({ show: false });
    // win.loadURL(...)
    // win.webContents.on('did-finish-load', () => win.webContents.print({ silent: true }));
});

ipcMain.on('print-label', (event, data) => {
    console.log('Printing barcode label:', data);
    // Barcode printing logic
});
