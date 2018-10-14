"use strict";
const fs = require("file-system");
const path = require("path");

module.exports = bundler => {
    bundler.on("bundled", bundle => {
        let pkgFile;
        if(typeof bundler.mainBundle.entryAsset.getPackage === 'function') {
            // for parcel-bundler@>=1.9
            pkgFile = Promise.resolve(bundler.mainBundle.entryAsset.getPackage());
        } else {              
            if (bundler.mainAsset &&
                bundler.mainAsset.package &&
                bundler.mainAsset.package.pkgfile) {
                // for parcel-bundler version@<1.8
                pkgFile = require(bundler.mainAsset.package.pkgfile);
            } else {
                // for parcel bundler@1.8
                pkgFile = bundler.mainBundle.entryAsset.package;
            }
        }

        const copyDir = (staticDir, bundleDir) => {
            if (fs.existsSync(staticDir)) {
                const copy = (filepath, relative, filename) => {
                    const dest = filepath.replace(staticDir, bundleDir);
                    if (!filename) {
                        fs.mkdir(filepath, dest);
                    } else {
                        if (fs.existsSync(dest)) {
                            const destStat = fs.statSync(dest);
                            const srcStat = fs.statSync(filepath);
                            if (destStat.mtime <= srcStat.mtime) { // File was modified - let's copy it and inform about overwriting.
                                console.info(`Info: Static file '${filepath}' do already exist in '${bundleDir}'. Overwriting.`);
                                fs.copyFile(filepath, dest);
                            }
                        } else {
                            fs.copyFile(filepath, dest);
                        }
                    }
                };
                fs.recurseSync(staticDir, copy);
            } else {
                console.warn(`Warning: Static directory '${staticDir}' do not exist. Skipping.`);
            }
        };

        if (typeof pkgFile.then === 'function') {
            pkgFile.then(pkg => {
                // Get 'staticPath' from package.json file
                const staticDir = pkg.staticPath || "static";
                const bundleDir = path.dirname(bundle.name);
                if (Array.isArray(staticDir)) {
                    for(let dir of staticDir) {
                        copyDir(dir, bundleDir);
                    }
                } else {
                    copyDir(staticDir, bundleDir);
                }
            });
        } else {
            // Get 'staticPath' from package.json file
            const staticDir = pkgFile.staticPath || "static";
            const bundleDir = path.dirname(bundle.name);
            if (Array.isArray(staticDir)) {
                for(let dir of staticDir) {
                    copyDir(dir, bundleDir);
                }
            } else {
                copyDir(staticDir, bundleDir);
            }
        }
    });
};
