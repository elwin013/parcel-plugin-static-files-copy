"use strict";
const fs = require("file-system");
const minimatch = require("minimatch");
const path = require("path");

const DEFAULT_CONFIG = {
    "staticPath": [ "static" ],
    "watcherGlob": null
};


module.exports = bundler => {
    bundler.on("bundled", bundle => {
        let pkgFile;
        let mainAsset;
        let config;
        if(typeof bundler.mainBundle.entryAsset.getPackage === 'function') {
            // for parcel-bundler@>=1.9
            mainAsset = bundler.mainBundle.entryAsset;
            pkgFile = Promise.resolve(mainAsset.getPackage());
        } else {
            if (bundler.mainAsset &&
                bundler.mainAsset.package &&
                bundler.mainAsset.package.pkgfile) {
                // for parcel-bundler version@<1.8
                mainAsset = bundler.mainAsset;
                pkgFile = require(mainAsset.package.pkgfile);
            } else {
                // for parcel bundler@1.8
                mainAsset = bundler.mainBundle.entryAsset;
                pkgFile = mainAsset.package;
            }
        }

        const parseConfig = (pkg) => {
            config = Object.assign({}, DEFAULT_CONFIG, pkg.staticFiles);
            if (pkg.staticPath) { // <1.2.5 compatability
                config.staticPath = pkg.staticPath;
            }
            if (!Array.isArray(config.staticPath)) { // ensure array of paths
                config.staticPath = [ config.staticPath ];
            }
        };

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
                                console.info(`Info: Static file '${filepath}' already exists in '${bundleDir}'. Overwriting.`);
                                fs.copyFile(filepath, dest);
                            }
                        } else {
                            fs.copyFile(filepath, dest);
                        }
                        // watch for changes?
                        if (mainAsset &&
                            config.watcherGlob &&
                            minimatch(filepath, config.watcherGlob)) {
                            bundler.watch(filepath, mainAsset);
                        }
                    }
                };
                fs.recurseSync(staticDir, copy);
            } else {
                console.warn(`Warning: Static directory '${staticDir}' does not exist. Skipping.`);
            }
        };

        if (typeof pkgFile.then === 'function') {
            pkgFile.then(pkg => {
                parseConfig(pkg);
                const bundleDir = path.dirname(bundle.name);
                for(let dir of config.staticPath) {
                    copyDir(dir, bundleDir);
                }
            });
        } else {
            parseConfig(pkgFile);
            const bundleDir = path.dirname(bundle.name);
            for(let dir of config.staticPath) {
                copyDir(dir, bundleDir);
            }
        }
    });
};
