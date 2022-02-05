const config = require("../libs/config.js");

module.exports = {
    onAssetsLoaded(assets) {
        console.log("LOADED!!");
        global.win.webContents.send("onAssetsLoaded", assets);
    },
    onAssetsFailedLoading(e) {
        global.win.webContents.send("onAssetsFailedLoading", e);
    },
    onAssetFailedLoading(e) {
        console.log(e);
    },
    onAssetsNotLoaded() {
    },
    onDownloadProgress (status) {
        global.win.webContents.send("onDownloadProgress", status);
    },
    onDownloadComplete (status) {
        global.win.webContents.send("onDownloadComplete", status);
    },
    onDownloadFailed(e) {
        global.win.webContents.send("onDownloadFailed", e);
    },
    onAuthValid() {
        global.win.webContents.send("onAuthValid");
    },
    onAuthReceived(auth) {
        config.save("auth_key", auth);
        global.win.webContents.send("onAuthReceived", auth);
    }
}