const crypto = require('crypto')
const fs = require("fs")
const path = require("path")
const http = require("./http.js")
const config = require("./config.js")
const dispatcher = require("./dispatcher.js");
const sanitize = require("sanitize-filename");
const Downloader = require("nodejs-file-downloader");
const utils = require('./utils.js')

unityAssets = [];
continueLoadAssets = false;
allDownloaders = {};

const init = () => {
    unityAssets = [];
    if (fs.existsSync("unity_assets.json")) {
        unityAssets = JSON.parse(fs.readFileSync("unity_assets.json"));
        verifyPhysicalAssets();
        dispatcher.dispatch("onAssetsLoaded", unityAssets);
    }
    else {
        dispatcher.dispatch("onAssetsNotLoaded");
    }
    startLoadingAssets();
    setInterval(startLoadingAssets, 30000);
}

const startLoadingAssets = () => {
    if (!isDownloading()) {
        continueLoadAssets = true;
        loadAssets();
    }
}

const stopLoadingAssets = () => {
    continueLoadAssets = false;
}

const getProfile = async () => {
    try {
        let userInfo = await http.get("https://api.unity.com/v1/users/" + config.get("user_id"));
        dispatcher.dispatch("onProfileInfo", userInfo.data);
    }
    catch(e) {
        console.log("Error loading profile data");
    }
}

const loadAssets = async () => {
    if (isDownloading()) return;
    unityAssets = [];
    try {
        unityAssetsResponse = await http.get("https://packages-v2.unity.com/-/api/purchases?offset=0&limit=1000&orderBy=name&order=asc");
        unityAssetsResponse = unityAssetsResponse.data.results;

        for (var app in unityAssetsResponse) {
            if (continueLoadAssets) {
                getAppMetadata(unityAssetsResponse[app].packageId).then((appMetaData) => {
                    let size = appMetaData.uploads;
                    size = size[Object.keys(size)[0]].downloadSize;
                    
                    let appJson = {
                        packageId:appMetaData.packageId,
                        name:sanitize(appMetaData.displayName),
                        publisher:sanitize(appMetaData.productPublisher.name),
                        version:appMetaData.version.name,
                        size:{
                            raw:parseInt(size),
                            human:utils.bytesForHuman(size)
                        }
                    };

                    unityAssets.push(appJson);
                    fs.writeFileSync("unity_assets.json", JSON.stringify(unityAssets));
                    if (unityAssets.length == unityAssetsResponse.length) {
                        verifyPhysicalAssets();
                        dispatcher.dispatch("onAuthValid");
                        dispatcher.dispatch("onAssetsLoaded", unityAssets);
                    }
                }).catch((e) => {
                    dispatcher.dispatch("onAssetFailedLoading", e.message);
                });
            }
        }
    }
    catch(e) {
        dispatcher.dispatch("onAssetsFailedLoading", e);
    }
}

const verifyPhysicalAssets = () => {
    for (var app in unityAssets) {
        let appPath = config.get("download_path") + path.sep + unityAssets[app].publisher + path.sep;
        if (fs.existsSync(appPath + unityAssets[app].name + ".unitypackage")) {
            if (fs.existsSync(appPath + unityAssets[app].name + ".version")) {
                let version = fs.readFileSync(appPath + unityAssets[app].name + ".version");
                if (version == unityAssets[app].version) {
                    unityAssets[app].fileStatus = "UPDATED";
                }
                else {
                    unityAssets[app].fileStatus = "PREVIOUS";
                }
            }
            else {
                unityAssets[app].fileStatus = "UNKNOWN";
            }
        }
        else {
            unityAssets[app].fileStatus = "NONEXIST";
        }
    }
}

const getAppMetadata = async (packageId) => {
    try {
        let appMetadata = await http.get("https://packages-v2.unity.com/-/api/product/" + packageId);
        appMetadata = appMetadata.data;
        return appMetadata;
    }
    catch(e) {
        console.log("Error getting metadata: " + e.message);
        return null;
    }
}

const getAppDownloadInfo = async (packageId) => {
    return new Promise((resolve, reject) => {
        http.get("https://packages-v2.unity.com/-/api/legacy-package-download-info/" + packageId).then((downloadInfo) => {
            resolve(downloadInfo);
        }).catch((e) => {
            reject(e);
        });
    });
}

const downloadAsset = async (packageId) => {
    getAppDownloadInfo(packageId).then(async (downloadInfo) => {
        downloadInfo = downloadInfo.data.result.download;
        let appData = getPackageById(packageId);
        let appPath = config.get("download_path") + path.sep + appData.publisher + path.sep;
        let appName = appData.name;
        appData.prevFileStatus = appData.fileStatus;
        
        if (fs.existsSync(appPath + appName + ".download")) {
            fs.unlinkSync(appPath + appName + ".download");
        }
        
        const downloader = new Downloader({
            url: downloadInfo.url,
            directory: appPath, //Sub directories will also be automatically created if they do not exist.
            fileName: appName + ".undec",
            cloneFiles: false
        });
        allDownloaders[packageId] = {downloader:downloader, progressThrottle:200, lastProgress:null};
        downloader.config.onProgress = (percentage, chunk, remainingSize) => {
            if (allDownloaders[packageId]) {
                if (!allDownloaders[packageId].lastProgress || (new Date().getTime()) - allDownloaders[packageId].lastProgress > allDownloaders[packageId].progressThrottle) {
                    appData.fileStatus = "DOWNLOADING";
                    appData.downloadProgress = percentage;
                    if (percentage == 100) {
                        appData.fileStatus = "DECODING";
                    }
                    dispatcher.dispatch("onDownloadProgress", {packageId:packageId, update:appData});            
                    allDownloaders[packageId].lastProgress = (new Date().getTime());
                }
            }
        };
        try {
            downloader.download().then(() => {
                if (downloadInfo.key != "") {
                    decrypt(appPath + appName + ".undec", appPath + appName + ".unitypackage", downloadInfo.key.trim()).then(() => {
                        utils.wait(1).then(() => {
                            fs.unlinkSync(appPath + appName + ".undec");
                        });
                        reportComplete(appData, appPath + appName, appData.version, packageId);
                    }).catch((e) => {
                        dispatcher.dispatch("onDownloadFailed", {packageId:packageId, message:e.message});
                    });
                }
                else {
                    fs.renameSync(appPath + appName + ".undec", appPath + appName + ".unitypackage");
                    reportComplete(appData, appPath + appName, appData.version, packageId);
                }
            }).catch((e) => {
                dispatcher.dispatch("onDownloadFailed", {packageId:packageId, message:e.message});
            });
        }
        catch(e) {
            dispatcher.dispatch("onDownloadFailed", {packageId:packageId, message:e.message});
        }
    }).catch((e) => {
        dispatcher.dispatch("onDownloadFailed", {packageId:packageId, message:e.message});
    });
}

const cancelDownload = (packageId) => {
    if (allDownloaders[packageId]) {
        let appData = getPackageById(packageId);
        allDownloaders[packageId].downloader.cancel();
        appData.fileStatus = appData.prevFileStatus;
        if (fs.existsSync(config.get("download_path") + path.sep + appData.publisher + path.sep + appData.name + ".undec.download")) {
            fs.unlinkSync(config.get("download_path") + path.sep + appData.publisher + path.sep + appData.name + ".undec.download");
        }
        delete allDownloaders[packageId];
        dispatcher.dispatch("onAssetsLoaded", unityAssets);
    }
}

const isDownloading = () => {
    return Object.keys(allDownloaders).length > 0;
}

const reportComplete = (appData, appPath, appVersion, packageId) => {
    fs.writeFileSync(appPath + ".version", appVersion);
    appData.fileStatus = "UPDATED";
    delete allDownloaders[packageId];
    dispatcher.dispatch("onDownloadComplete", {packageId:packageId, update:appData});
}

const getPackageById = (packageId) => {
    return unityAssets.filter((item) => {
        return item.packageId == packageId;
    })[0];
}

const createDecryptStream = (packageKey) => {
    const cryptoBits = Buffer.from(packageKey, "hex")

    const keyBits = cryptoBits.subarray(0, 32)
    const ivBits = cryptoBits.subarray(32, cryptoBits.length)

    return crypto.createDecipheriv('aes-256-cbc', keyBits, ivBits)
}

const decrypt = (sourcePath, targetPath, packageKey) => {
    return new Promise((resolve, reject) => {
        try {
            let decipher = createDecryptStream(packageKey);
            const input = fs.createReadStream(sourcePath);
            const output = fs.createWriteStream(targetPath);
            input.pipe(decipher).pipe(output);
            resolve()
        }
        catch(e) {
            reject(e);
        }
    })
}

module.exports = {
    init,
    startLoadingAssets,
    stopLoadingAssets,
    downloadAsset,
    cancelDownload,
    isDownloading,
    getProfile
}