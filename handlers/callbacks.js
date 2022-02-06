const config = require("../libs/config.js");
const unity = require("../libs/unity.js");
const utils = require("../libs/utils.js")
const { Menu } = require("electron");

module.exports = {
    onAssetsLoaded(assets) {
        global.mainWindow.webContents.send("onAssetsLoaded", assets);
    },
    onAssetsFailedLoading(e) {
        global.mainWindow.webContents.send("onAssetsFailedLoading", e);
    },
    onAssetFailedLoading(e) {
        console.log("Failed loading assets");
    },
    onAssetsNotLoaded() {
    },
    onDownloadProgress (status) {
        global.mainWindow.webContents.send("onDownloadProgress", status);
    },
    onDownloadComplete (status) {
        global.mainWindow.webContents.send("onDownloadComplete", status);
    },
    onDownloadFailed(e) {
        global.mainWindow.webContents.send("onDownloadFailed", e);
    },
    onAuthValid() {
        global.mainWindow.webContents.send("onAuthStatus", {
            status:"PROFILE_INFO", 
            data:{
                name:{
                    fullName:config.get("user_name")
                }
            }
        });
    },
    onAuthReceived(authData) {
        config.set("auth_key", authData.auth_token);
        config.set("user_id", authData.user_id);
        config.save();
        
        global.menuTemplate[0].submenu[3].label = "Logout";
        global.menu = Menu.buildFromTemplate(global.menuTemplate);
        Menu.setApplicationMenu(global.menu);

        global.mainWindow.webContents.send("onAuthStatus", {
            status:"LOGGED_IN"
        });
        utils.wait(1).then(() => {
            unity.getProfile();
        });
        
    },
    onProfileInfo(userData) {
        config.set("user_name", userData.name.fullName);
        config.save();
        global.mainWindow.webContents.send("onAuthStatus", {
            status:"PROFILE_INFO",
            data:userData
        });
        global.mainWindow.webContents.send("onProfileInfo", userData);
    }
}