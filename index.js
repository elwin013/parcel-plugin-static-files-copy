'use strict';
const fs = require('file-system');
const minimatch = require('minimatch');
const path = require('path');

const DEFAULT_CONFIG = {
    'staticPath': [ 'static' ],
    'watcherGlob': null
};

module.exports = bundler => {
    bundler.on('bundled', async(bundle) => {

        // main asset and package dir, depending on version of parcel-bundler
        let mainAsset =
            bundler.mainAsset ||                                                // parcel < 1.8
            bundler.mainBundle.entryAsset ||                                    // parcel >= 1.8 single entry point
            bundler.mainBundle.childBundles.values().next().value.entryAsset;   // parcel >= 1.8 multiple entry points
        let pkg;
        if (typeof mainAsset.getPackage === 'function') {                       // parcel > 1.8
            pkg = (await mainAsset.getPackage());
        } else {                                   // parcel <= 1.8
            pkg = mainAsset.package;
        }

        // config
        let config = Object.assign({}, DEFAULT_CONFIG, pkg.staticFiles);
        if (pkg.staticPath) { // parcel-plugin-static-files-copy<1.2.5
            config.staticPath = pkg.staticPath;
        }
        if (!Array.isArray(config.staticPath)) { // ensure array
            config.staticPath = [ config.staticPath ];
        }

        // poor-man's logger
        const logLevel = parseInt(bundler.options.logLevel);
        const pmLog = (level, ...msgs) => {
            if (logLevel >= level) {
                console.log(...msgs);
            }
        };

        // static paths are usually just a string can be specified as 
        // an object to make them conditional on the output directory
        // by specifying them in the form 
        // {"outDirPattern":"dist1", "staticPath":"static1"},
        // {"outDirPattern":"dist2", "staticPath":"static2"}
        config.staticPath = config.staticPath.map(path => {
            if (typeof path === 'object') {
                if (!path.staticPath || !path.outDirPattern) {
                    console.error(`Error: parcel-plugin-static-files-copy: When staticPath is an object, expecting it to have the keys 'staticPath' and 'outDirPattern', but found: ${path}`);
                    return null;
                }

                if (minimatch(bundler.options.outDir, path.outDirPattern)) {
                    pmLog(3, `outDir matches '${path.outDirPattern}' so copying static files from '${path.staticPath}'`);
                    return path.staticPath;
                } else {
                    pmLog(3, `outDir does not match '${path.outDirPattern}' so not copying static files from '${path.staticPath}'`);
                    return null;
                }
            } else {
                return path;
            }
        }).filter(path => path != null);

        // recursive copy function
        let numWatches = 0;
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
                                pmLog(3, `Static file '${filepath}' already exists in '${bundleDir}'. Overwriting.`);
                                fs.copyFile(filepath, dest);
                            }
                        } else {
                            fs.copyFile(filepath, dest);
                        }
                        // watch for changes?
                        if (config.watcherGlob && bundler.watcher && minimatch(filepath, config.watcherGlob)) {
                            numWatches++;
                            bundler.watch(filepath, mainAsset);
                        }
                    }
                };
                fs.recurseSync(staticDir, copy);
            } else {
                pmLog(2, `Static directory '${staticDir}' does not exist. Skipping.`);
            }
        };

        const bundleDir = path.dirname(bundle.name || bundler.mainBundle.childBundles.values().next().value.name);
        for (let dir of config.staticPath) {
            copyDir(path.join(pkg.pkgdir, dir), bundleDir);
        }

        if (config.watcherGlob && bundler.watcher) {
            pmLog(3, `Watching for changes in ${numWatches} static files.`);
        }

    });
};
