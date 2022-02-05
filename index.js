const { app, BrowserWindow } = require('electron')

function createWindow () {
const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    win.loadFile('public/index.html')
}

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});


app.whenReady().then(() => {
    createWindow();
});