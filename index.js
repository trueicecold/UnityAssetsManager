const { ipcMain, app, BrowserWindow } = require('electron')
const proxy = require("./libs/proxy.js");
require("./handlers/definitions.js");
require("./libs/config.js");

function createWindow () {
    global.win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    global.win.loadFile('public/index.html')
}

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});

app.whenReady().then(() => {
    createWindow();
});