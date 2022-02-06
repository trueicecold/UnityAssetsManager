const AnyProxy = require('anyproxy');
const exec = require("child_process").exec;

let inited = false;
let proxyServer;
let proxyOptions;

const init = () => {
    proxyOptions = {
        port: 8001,
        rule: require('./proxy_rules/unity.js'),
        webInterface: {
            enable: true,
            webPort: 8002
        },
        throttle: 10000,
        forceProxyHttps: false,
        wsIntercept: false,
        silent: true
    }

    proxyServer = new AnyProxy.ProxyServer(proxyOptions);
    proxyServer.on('ready', () => { /* */ });
    proxyServer.on('error', (e) => { /* */ });
    inited = true;
}

const generateCA = () => {
    if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
        AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
            if (!error) {
                console.log("CA Certificate Generated")
            } else {
              console.error('Error generating rootCA', error);
            }
        });
    }
    else {
        console.log("Certificates are already generated");
    }
}

const trustCA = () => {
    const isWin = /^win/.test(process.platform);
    if (isWin) {
        exec('start ' + AnyProxy.utils.certMgr.getRootCAFilePath());
    } else {
        exec('open ' + AnyProxy.utils.certMgr.getRootCAFilePath());
    }
}

const start = (global = true) => {
    if (!inited) {
        init();
        proxyServer.start();
    }
    if (global)
        enableGlobalProxy();
    
}

const stop = () => {
    disableGlobalProxy();
    //proxyServer.close();
}

const enableGlobalProxy = () => {
    AnyProxy.utils.systemProxyMgr.enableGlobalProxy('127.0.0.1', '8001');
}

const disableGlobalProxy = () => {
    AnyProxy.utils.systemProxyMgr.disableGlobalProxy();
}

module.exports = {
    init,
    start,
    stop,
    generateCA,
    trustCA,
    enableGlobalProxy,
    disableGlobalProxy
}