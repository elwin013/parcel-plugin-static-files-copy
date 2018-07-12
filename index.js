const fs = require("file-system");
const path = require("path");

module.exports = async bundler => {
    bundler.on("bundled", bundle => {
        let pkgFile;
        if (
            bundler.mainAsset &&
            bundler.mainAsset.getPackage
        ) {
            // for parcel-bundler version@<1.9
            pkgFile = await bundler.mainAsset.getPackage();
        }
        else if (
            bundler.mainAsset &&
            bundler.mainAsset.package &&
            bundler.mainAsset.package.pkgfile
        ) {
            // for parcel-bundler version@<1.8
            pkgFile = require(bundler.mainAsset.package.pkgfile);
        } else {
            pkgFile = bundler.mainBundle.entryAsset.package;
        }

        // Get 'staticPath' from package.json file
        const staticDir = pkgFile["staticPath"] || "static";

        if (fs.existsSync(staticDir)) {
            const bundleDir = path.dirname(bundle.name);

            let copy = function(filepath, relative, filename) {
                if (!filename) {
                    fs.mkdir(filepath, filepath.replace(staticDir, bundleDir));
                } else {
                    fs.copyFile(
                        filepath,
                        filepath.replace(staticDir, bundleDir)
                    );
                }
            };
            fs.recurseSync(staticDir, copy);
        } else {
            console.log(
                "Warning: Static directory do not exist. Skipping copy."
            );
        }
    });
};
