module.exports = {
    set(cb) {
        this.cb = cb;
    },
    approve(header) {
        if (this.cb) {
            this.cb(header);
        }
    },
    remove() {
        this.cb = null;
    }
}