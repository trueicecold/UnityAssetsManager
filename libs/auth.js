const utils = require("./utils.js")
const http = require("./http.js")
const proxy = require("./proxy.js");
const cryptoSHA256 = require('crypto-js/sha256');
const Base64 = require('crypto-js/enc-base64');
const dispatcher = require('./dispatcher.js');
const config = require("./config.js");

authCode = "";
urlQuery = "";

const prepareLoginScreen = () => {
    authCode = utils.generateRandomString(100);
    urlQuery = utils.objectToQueryString({
        client_id: "unity_hub",
        redirect_uri: "unityhub://login",
        code_challenge: cryptoSHA256(authCode).toString(Base64).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'),
        code_challenge_method: 's256',
        response_type: 'code',
        locale: "en_US"
    });
    proxy.start(false);
    mainFunctions.createLoginWindow("https://api.unity.com/v1/oauth2/authorize?" + urlQuery);
}

const validateLogin = (response) => {
    let code = response.substr(response.indexOf("unityhub://login/?code=")+23);
    code = code.substr(0, code.indexOf("&"));
    validateCode(code);
    mainFunctions.destroyLoginWindow();
}

const validateCode = async(code) => {
    await http.post("https://api.unity.com/v1/oauth2/token", utils.objectToQueryString({
        client_id: "unity_hub",
        code_verifier: authCode,
        redirect_uri: "unityhub://login",
        code: code,
        grant_type: "authorization_code"
    })).then((result) => {
        dispatcher.dispatch("onAuthReceived", {auth_token:result.data.access_token, user_id:result.data.user});
    }).catch((e) => {
        console.log("Error validating code");
        console.log(e);
    });
}

const revoke = () => {
    global.mainWindow.webContents.session.clearStorageData();
    config.set("auth_key", "");
    config.save();
    global.menuTemplate[0].submenu[3].label = "Login";
    global.menu = Menu.buildFromTemplate(global.menuTemplate);
    Menu.setApplicationMenu(global.menu);
}

module.exports = {
    prepareLoginScreen,
    validateLogin,
    validateCode,
    revoke
}