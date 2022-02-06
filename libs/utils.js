module.exports = {
    bytesForHuman(bytes) {
        let units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    
        let i = 0
        
        for (i; bytes > 1024; i++) {
            bytes /= 1024;
        }
    
        return bytes.toFixed(1) + ' ' + units[i]
    },
    wait(seconds) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true)
            }, seconds * 1000);
        });
    },
    objectToQueryString(obj) {
        var str = [];
        for (var p in obj)
          if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          }
        return str.join("&");
    },
    generateRandomString(length) {
        return Array(length).fill().map(()=>"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.random()*62)).join("")
    }
}