const urlParser = require('url');
const https = require("https");
const proxyAgent = require("http-proxy-agent");
const config = require("./config.js");
const axios = require("axios");
const fetch = require('node-fetch');

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  })

//axios.defaults.headers.get["User-Agent"] = "UnityEditor/2020.3.24f1 (Windows; U; Windows NT 10.0; en)";
axios.defaults.httpsAgent = httpsAgent;
axios.defaults.proxy = {
    protocol: "http",
    host: "127.0.0.1",
    port: 8888
}

const get = (url, headers = null) => {
    return new Promise(function(resolve, reject) {
        axios.get(url, {
            headers:{
                "Authorization":"Bearer " + config.get("auth_key")
            }
        }).then((result) => {
            resolve(result);
        }).catch((e) => {
            reject({status:e.response.status, message:e.message});
        })
    });
}

module.exports = {
    get
}