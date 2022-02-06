const { app, Menu, ipcMain, BrowserWindow } = require('electron');
const proxy = require('./libs/proxy.js');
require("./handlers/definitions.js");
require("./libs/config.js");

global.mainFunctions = {
    createMainWindow() {
        global.mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            }
        })
    
        global.mainWindow.loadFile('public/index.html');
    },
    async createLoginWindow(url) {
        this.destroyLoginWindow();
        global.loginWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                javascript:false,
                nodeIntegration: true,
                contextIsolation: false,
            }
        });

        loginWindow.webContents.session.setProxy({proxyRules:"http://127.0.0.1:8001"}).then(() => {
            global.loginWindow.loadURL(url);
        });

        loginWindow.on("close", function() {
            proxy.stop();
        });
    },
    destroyLoginWindow() {
        if (global.loginWindow) {
            global.loginWindow.close();
            global.loginWindow = null;
        }
    }
}

global.menuTemplate = [
    {
        label: "File",
        submenu: [
            {
                label:"Generate Proxy Certificates",
                click:function() {
                    proxy.generateCA();
                }
            },
            {
                label:"Trust Proxy Certificates",
                click:function() {
                    proxy.trustCA();
                }
            },
            {
                type: "separator"
            },
            {
                label:"Login",
                click:function() {
                    ipcMain.emit("auth.start");
                }
            },
            {
                type: "separator"
            },            
            {
                label:"Exit",
                click:function() {
                    app.quit();
                }
            }
        ]
    },
];

global.menu = Menu.buildFromTemplate(global.menuTemplate);
Menu.setApplicationMenu(global.menu);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});

app.whenReady().then(() => {
    mainFunctions.createMainWindow();
});