const dispatcher = require("../dispatcher.js");
const auth = require("../auth.js");

module.exports = {
  // introduction
  summary: 'Unity Login',
  // intercept before send request to server
  *beforeSendRequest(requestDetail) {
    /*if (requestDetail.url.indexOf("unity.com") > -1) {
        let headers = this.mapHeaders(requestDetail._req.rawHeaders);
        if (headers["Authorization"]) {
          dispatcher.dispatch("onAuthReceived", headers["Authorization"].split(" ")[1]);
        }
    }*/
  },
  // deal response before send to client
  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url.indexOf("api.unity.com") > -1) {
      if (responseDetail.response.body.toString().indexOf("unityhub://login/?code=") > -1) {
        auth.validateLogin(responseDetail.response.body.toString());
        //responseDetail.response.body = "";
      }
    }
  },
  // if deal https request
  *beforeDealHttpsRequest(requestDetail) {
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