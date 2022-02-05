const dispatcher = require("../dispatcher.js");

module.exports = {
  // introduction
  summary: 'Unity Login',
  // intercept before send request to server
  *beforeSendRequest(requestDetail) {
    console.log(requestDetail.url);
    if (requestDetail.url.indexOf("unity.com") > -1) {
        let headers = this.mapHeaders(requestDetail._req.rawHeaders);
        if (headers["Authorization"]) {
          dispatcher.dispatch("onAuthReceived", headers["Authorization"].split(" ")[1]);
        }
    }
  },
  // deal response before send to client
  *beforeSendResponse(requestDetail, responseDetail) { /* ... */ },
  // if deal https request
  *beforeDealHttpsRequest(requestDetail) {
    console.log(requestDetail.host);
    if (requestDetail.host.indexOf("unity.com") > -1)
        return true;
  },
  // error happened when dealing requests
  *onError(requestDetail, error) { /* ... */ },
  // error happened when connect to https server
  *onConnectError(requestDetail, error) { /* ... */ },

  mapHeaders(rawHeaders) {
    let headers = {};
    for (var i=0;i<rawHeaders.length;i++) {
        if (i %2 == 0) {
            headers[rawHeaders[i]] = rawHeaders[i+1];
        }
    }
    return headers;
  }
};