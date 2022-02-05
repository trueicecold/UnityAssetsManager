var utils = {
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
    }
}