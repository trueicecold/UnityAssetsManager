const { ipcMain } = require("electron");
const callbacks = require("./callbacks.js");
const dispatcher = require("../libs/dispatcher.js");
const unity = require("../libs/unity.js");
const proxy = require("../libs/proxy.js");
const config = require("../libs/config.js");
const auth = require("../libs/auth.js");

ipcMain.on("handlers.init", () => {
    dispatcher.addListener("onAssetsLoaded", callbacks.onAssetsLoaded);
    dispatcher.addListener("onAssetsFailedLoading", callbacks.onAssetsFailedLoading);
    dispatcher.addListener("onAssetFailedLoading", callbacks.onAssetFailedLoading);
    dispatcher.addListener("onAssetsNotLoaded", callbacks.onAssetsNotLoaded);
    dispatcher.addListener("onDownloadProgress", callbacks.onDownloadProgress);
    dispatcher.addListener("onDownloadComplete", callbacks.onDownloadComplete);
    dispatcher.addListener("onDownloadFailed", callbacks.onDownloadFailed);
    dispatcher.addListener("onAuthValid", callbacks.onAuthValid);
    dispatcher.addListener("onAuthReceived", callbacks.onAuthReceived);
    dispatcher.addListener("onProfileInfo", callbacks.onProfileInfo);
});

ipcMain.on("unity.init", () => {
    unity.init();
});

ipcMain.on("proxy.start", () => {
    proxy.start();
});

ipcMain.on("proxy.stop", () => {
    proxy.stop();
});

ipcMain.on("assets.load", () => {
    unity.startLoadingAssets();
});

ipcMain.on("assets.download", (e, packageId) => {
    unity.downloadAsset(packageId);
});

ipcMain.on("assets.cancelDownload", (e, packageId) => {
    unity.cancelDownload(packageId);
});

ipcMain.on("unity.login-response", (e, response) => {
    auth.validateLogin(response);
});

ipcMain.on("auth.start", (e) => {
    auth.prepareLoginScreen();
});

ipcMain.on("auth.revoke", (e) => {
    auth.revoke();
});