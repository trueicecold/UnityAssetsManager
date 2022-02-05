const fs = require("fs");
const proxy = require("../libs/proxy.js");
const dispatcher = require("../libs/dispatcher.js");
const config = require("../libs/config.js");
const unity = require("../libs/unity.js");
var appLogic = {};

window.$ = window.jQuery = require('jquery');

appLogic.init = () => {
    //proxy.disableGlobalProxy();
    config.load();
    if (config.get("auth_key"))
        appLogic.setAuthText();
    
    appLogic.initHandlers();

    unity.init();
    appLogic.loadAssets();
    setInterval(appLogic.loadAssets, 30000);
}

appLogic.startAuth = () => {
    console.log("Start Listening")
    dispatcher.addListener("onAuthReceived", appLogic.handleAuth);
    proxy.start();
}

appLogic.handleAuth = (auth) => {
    config.set("auth_key", auth);
    appLogic.stopAuth();
    appLogic.setAuthText();
}

appLogic.setAuthText = () => {
    $("#authStatus").removeClass("error").addClass("success").find(".title").html("Auth key found!");
}

appLogic.setAuthTextError = () => {
    $("#authStatus").removeClass("success").addClass("error").find(".title").html("Auth key invalid!");
}

appLogic.stopAuth = () => {
    dispatcher.removeListener("onAuthReceived", appLogic.handleAuth);
    proxy.stop();
}

appLogic.loadAssets = () => {
    if (!unity.isDownloading()) {
        unity.startLoadingAssets();
    }
}

appLogic.onAssetsLoaded = (assets) => {
    $(".appsList tbody").empty();
    if (!appLogic.appsTable) {
        appLogic.appsTable = $('.appsList').DataTable({
            scrollY: "73%",
            scrollCollapse: true,
            data:assets,
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
                    data: "version",
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
                    data: "version",
                    className: "actions",
                    orderable: false,
                    render:function(data, type, row) {
                        if (row.fileStatus == "UNKNOWN" || row.fileStatus == "NONEXIST")
                            return "<div class='button' onClick='appLogic.downloadAsset(" + row.packageId + ")'>Download</div>";
                        else if (row.fileStatus == "PREVIOUS")
                            return "<div class='button' onClick='appLogic.downloadAsset(" + row.packageId + ")'>Update</div>";
                        else if (row.fileStatus == "UPDATED")
                            return "";
                        else if (row.fileStatus == "DOWNLOADING")
                            return "<div class='button' onClick='appLogic.cancelDownload(" + row.packageId + ")'>Cancel</div>";
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
    unity.downloadAsset(packageId);
}

appLogic.cancelDownload = (packageId) => {
    console.log("APP CANCEL");
    unity.cancelDownload(packageId);
}

appLogic.onAssetsFailedLoading = (reason) => {
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

appLogic.onDownloadProgress = appLogic.onDownloadComplete = (status) => {
    appLogic.appsTable.rows("[package-id=" + status.packageId + "]").invalidate();
}

appLogic.onDownloadFailed = (error) => {
    console.log(error.packageId);
    console.log(error.message);
}

appLogic.initHandlers = () => {
    dispatcher.addListener("onAssetsLoaded", appLogic.onAssetsLoaded);
    dispatcher.addListener("onAssetsFailedLoading", appLogic.onAssetsFailedLoading);
    dispatcher.addListener("onAssetsNotLoaded", appLogic.onAssetsNotLoaded);
    dispatcher.addListener("onDownloadProgress", appLogic.onDownloadProgress);
    dispatcher.addListener("onDownloadComplete", appLogic.onDownloadComplete);
    dispatcher.addListener("onDownloadFailed", appLogic.onDownloadFailed);
}