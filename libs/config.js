const fs = require("fs");

app_config = {
    "auth_key":"",
    "download_path":"downloads",
    "download_threads":3
};

const load = () => {
    if (fs.existsSync("config.json")) {
        app_config = JSON.parse(fs.readFileSync("config.json"));
    }
    else {
        save();
    }
}

const save = () => {
    fs.writeFileSync("config.json", JSON.stringify(app_config, null, 4));
}

const set = (param, value) => {
    app_config[param] = value;
    save();
}

const get = (param) => {
    return app_config[param];
}

module.exports = {
    load,
    save,
    get,
    set
}