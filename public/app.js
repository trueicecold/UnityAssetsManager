const { ipcRenderer } = require("electron");
var appLogic = {};

window.$ = window.jQuery = require('jquery');

appLogic.loadedAssets = null;

appLogic.init = () => {
    ipcRenderer.send("handlers.init");
    ipcRenderer.send("unity.init");
    appLogic.initHandlers();
}

appLogic.startAuth = () => {
    ipcRenderer.on("onAuthReceived", appLogic.onAuthValid);
    ipcRenderer.send("proxy.start");
}

appLogic.onAuthValid = (e) => {
    appLogic.setAuthText();
}

appLogic.setAuthText = () => {
    $("#authStatus").removeClass("error").addClass("success").find(".title").html("Auth key found!");
}

appLogic.setAuthTextError = () => {
    $("#authStatus").removeClass("success").addClass("error").find(".title").html("Auth key invalid!");
}

appLogic.stopAuth = () => {
    dispatcher.removeListener("onAuthReceived", appLogic.onAuthValid);
    ipcRenderer.send("proxy.stop");
}

appLogic.loadAssets = () => {
    ipcRenderer.send("assets.load");
}

appLogic.onAssetsLoaded = (e, assets) => {
    appLogic.loadedAssets = assets;
    $(".appsList tbody").empty();
    if (!appLogic.appsTable) {
        appLogic.appsTable = $('.appsList').DataTable({
            scrollY: "73%",
            scrollCollapse: true,
            data:appLogic.loadedAssets,
            paging:false,
            info:false,
            filter:false,
            createdRow:function (row, data, rowIndex) {
                $(row).attr("package-id", data.packageId);
            },
            columns: [
                { 
                    data: "name" 
                },
                { 
                    data: "publisher" 
                },
                { 
                    data: "version",
                    orderable: false
                },
                { 
                    data: "size.human",
                    orderable: false
                },
                {
                    data: "downloadProgress",
                    className: "actions",
                    orderable: false,
                    render:function(data, type, row) {
                        if (row.fileStatus == "UNKNOWN" || row.fileStatus == "NONEXIST")
                            return "";
                        else if (row.fileStatus == "PREVIOUS")
                            return "Previous Version";
                        else if (row.fileStatus == "UPDATED")
                            return "Up to date";
                        else if (row.fileStatus == "DOWNLOADING")
                            return "<span class='progressCaption'><span>Downloading... </span><br/>" + row.downloadProgress + "%</span><span class='progress' style='width:" + row.downloadProgress + "%'></span>";
                        else if (row.fileStatus == "DECODING")
                            return "DECODING...";
                    }
                },
                {
                    data: "downloadProgress",
                    className: "actions",
                    orderable: false,
                    render:function(data, type, row) {
                        if (row.fileStatus == "UNKNOWN" || row.fileStatus == "NONEXIST")
                            return "<button class='button' onClick='appLogic.downloadAsset(" + row.packageId + ")'>Download</button>";
                        else if (row.fileStatus == "PREVIOUS")
                            return "<button class='button' onClick='appLogic.downloadAsset(" + row.packageId + ")'>Update</button>";
                        else if (row.fileStatus == "UPDATED")
                            return "";
                        else if (row.fileStatus == "DOWNLOADING")
                            return "<button class='button' onClick='appLogic.cancelDownload(" + row.packageId + ")'>Cancel</button>";
                        else if (row.fileStatus == "DECODING")
                            return "";
                    }
                }
            ]
        });
    }
    else {
        appLogic.appsTable.clear();
        appLogic.appsTable.rows.add(assets).draw();
    }
}

appLogic.downloadAsset = (packageId) => {
    ipcRenderer.send("assets.download", packageId);
}

appLogic.cancelDownload = (packageId) => {
    console.log("WEB CANCEL SENT")
    ipcRenderer.send("assets.cancelDownload", packageId);
}

appLogic.onAssetsFailedLoading = (e, reason) => {
    if (reason.status == 401) {
        appLogic.setAuthTextError();
    }
    else {
        alert("Failed loading assets: " + reason.message);
    }
}

appLogic.onAssetsNotLoaded = () => {
    //$(".appsList tbody").empty().append($("#no_apps").clone().html());
}

appLogic.onDownloadProgress = (e, status) => {
    appLogic.updatePackageById(status.packageId, status.update);
    appLogic.appsTable.row("[package-id=" + status.packageId + "]").data(status.update).invalidate();
}

appLogic.onDownloadFailed = (e, error) => {
    console.log(error.packageId);
    console.log(error.message);
}

appLogic.getPackageById = (packageId) => {
    return appLogic.loadedAssets.filter((item) => {
        return item.packageId == packageId;
    })[0];
}

appLogic.updatePackageById = (packageId, update) => {
    for (var asset in appLogic.loadedAssets) {
        if (appLogic.loadedAssets[asset].packageId == packageId) {
            if (!appLogic.loadedAssets[asset].fileStatus != "DOWNLOADING" || parseFloat(update.downloadProgress) > parseFloat(appLogic.loadedAssets[asset].downloadProgress)) {
                appLogic.loadedAssets[asset] = update;
                return;
            }
        }
    }
}

appLogic.initHandlers = () => {
    ipcRenderer.on("onAuthValid", appLogic.onAuthValid);
    ipcRenderer.on("onAssetsLoaded", appLogic.onAssetsLoaded);
    ipcRenderer.on("onAssetsFailedLoading", appLogic.onAssetsFailedLoading);
    ipcRenderer.on("onDownloadProgress", appLogic.onDownloadProgress);
    ipcRenderer.on("onDownloadComplete", appLogic.onDownloadProgress);
    ipcRenderer.on("onDownloadFailed", appLogic.onDownloadFailed);
}