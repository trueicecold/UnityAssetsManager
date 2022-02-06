const urlParser = require('url');
const https = require("https");
const proxyAgent = require("http-proxy-agent");
const config = require("./config.js");
const axios = require("axios");
const fetch = require('node-fetch');
const utils = require('./utils.js');

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  })

axios.defaults.headers.get["User-Agent"] = "UnityEditor/2020.3.24f1 (Windows; U; Windows NT 10.0; en)";
axios.defaults.headers.post["User-Agent"] = "UnityEditor/2020.3.24f1 (Windows; U; Windows NT 10.0; en)";
axios.defaults.httpsAgent = httpsAgent;

/*axios.defaults.proxy = {
    protocol: "http",
    host: "127.0.0.1",
    port: 8888
}*/

const get = (url, headers = null) => {
    return new Promise(function(resolve, reject) {
        axios({
            method: 'get',
            url:url,
            headers: {
                "Authorization":"Bearer " + config.get("auth_key"),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36', 
                'Accept-Encoding':'gzip, deflate, br',
                ...headers
            }
        }).then((result) => {
            resolve(result);
        }).catch((e) => {
            reject({status:(e.response) ? e.response.status : null, message:e.message});
        });
    });
}

const post = (url, data, headers) => {
    return new Promise(function(resolve, reject) {
        axios({
            method: 'post',
            url: url,
            headers: {
                "Authorization":"Bearer " + config.get("auth_key"),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36', 
                'Accept-Encoding':'gzip, deflate, br',
                'Content-Type': 'application/x-www-form-urlencoded',
                ...headers
            },
            data : utils.objectToQueryString(data)
        }).then((result) => {
            resolve(result);
        }).catch((e) => {
            reject({status:(e.response) ? e.response.status : null, message:e.message});
        });
    });
}

module.exports = {
    get,
    post
}