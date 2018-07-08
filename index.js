var fs = require("file-system");
var path = require("path");

module.exports = (bundler) => {
    bundler.on("bundled", (bundle) => {
        var staticDir = "static/";
        var bundleDir = path.dirname(bundle.name) + "/";

        var copy = function (filepath, relative, filename) { 
            if(!filename) {
                fs.mkdir(filepath, filepath.replace(staticDir, bundleDir));
            } else {
                fs.copyFile(filepath, filepath.replace(staticDir, bundleDir));
            }
        };
        fs.recurseSync(staticDir, copy);
    });
};