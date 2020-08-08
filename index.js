'use strict';
const fs = require('fs');
const minimatch = require('minimatch');
const path = require('path');

const DEFAULT_CONFIG = {
    'staticPath': ['static'],
    'watcherGlob': null,
    'excludeGlob': null,
    'globOptions': {}
};

module.exports = bundler => {
    bundler.on('bundled', async (bundle) => {

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
            config.staticPath = [config.staticPath];
        }
        if (config.excludeGlob && !Array.isArray(config.excludeGlob)) {
            config.excludeGlob = [config.excludeGlob];
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
                if (!path.staticPath) {
                    console.error(`Error: parcel-plugin-static-files-copy: When staticPath is an object, expecting it to have at least the 'staticPath' key, but found: ${path}`);
                    return null;
                }

                if (path.outDirPattern) {
                    if (minimatch(bundler.options.outDir, path.outDirPattern, config.globOptions)) {
                        pmLog(3, `outDir matches '${path.outDirPattern}' so copying static files from '${path.staticPath}'`);
                    } else {
                        pmLog(3, `outDir does not match '${path.outDirPattern}' so not copying static files from '${path.staticPath}'`);
                        return null;
                    }
                }

                return path;
            } else {
                return {staticPath: path};
            }
        }).filter(path => path != null);

        // recursive copy function
        let numWatches = 0;

        /**
         * Recurse into directory and execute callback function for each file and folder.
         *
         * Based on https://github.com/douzi8/file-system/blob/master/file-system.js#L254
         *
         * @param dirpath directory to start from
         * @param callback function to be run on every file/directory
         */
        const recurseSync = (dirpath, callback) => {
            const rootpath = dirpath;

            function recurse(dirpath) {
                fs.readdirSync(dirpath).forEach(function (filename) {
                    const filepath = path.join(dirpath, filename);
                    const stats = fs.statSync(filepath);
                    const relative = path.relative(rootpath, filepath);

                    if (stats.isDirectory()) {
                        callback(filepath, relative);
                        recurse(filepath);
                    } else {
                        callback(filepath, relative, filename);
                    }

                });
            }

            recurse(dirpath);
        };
        const copyDir = (staticDir, bundleDir, excludeGlob) => {
            const copy = (filepath, relative, filename) => {
                if (excludeGlob.find(excludeGlob =>
                    minimatch(filepath, path.join(staticDir, excludeGlob), config.globOptions)
                )) {
                    return;
                }

                const dest = filepath.replace(staticDir, bundleDir);
                if (!filename) {
                    if (!fs.existsSync(dest)) {
                        fs.mkdirSync(dest, {recursive: true});
                    }
                } else {
                    if (fs.existsSync(dest)) {
                        const destStat = fs.statSync(dest);
                        const srcStat = fs.statSync(filepath);
                        if (destStat.mtime <= srcStat.mtime) { // File was modified - let's copy it and inform about overwriting.
                            pmLog(3, `Static file '${filepath}' already exists in '${bundleDir}'. Overwriting.`);
                            fs.copyFileSync(filepath, dest);
                        }
                    } else {
                        fs.copyFileSync(filepath, dest);
                    }
                    // watch for changes?
                    if (config.watcherGlob && bundler.watcher && minimatch(filepath, config.watcherGlob, config.globOptions)) {
                        numWatches++;
                        bundler.watch(filepath, mainAsset);
                    }
                }
            };
            recurseSync(staticDir, copy);
        };

        const copyFile = (filePath, bundleDir, excludeGlob) => {
            if (excludeGlob.find(excludeGlob =>
                minimatch(filePath, path.join(filePath, excludeGlob), config.globOptions)
            )) {
                return;
            }

            const parentDir = path.join(filePath, '..');
            const dest = filePath.replace(parentDir, bundleDir);
        
            if (fs.existsSync(dest)) {
                const destStat = fs.statSync(dest);
                const srcStat = fs.statSync(filePath);
                if (destStat.mtime <= srcStat.mtime) { // File was modified - let's copy it and inform about overwriting.
                    pmLog(3, `Static file '${filePath}' already exists in '${bundleDir}'. Overwriting.`);
                    fs.copyFileSync(filePath, dest);
                }
            } else {
                fs.copyFileSync(filePath, dest);
            }
            // watch for changes?
            if (config.watcherGlob && bundler.watcher && minimatch(filePath, config.watcherGlob, config.globOptions)) {
                numWatches++;
                bundler.watch(filePath, mainAsset);
            }
        
        };

        const outDir = bundler.options.outDir;
        const currentEnv = process.env.NODE_ENV;

        function processStaticFiles(singleBundle) {
            for (let dir of config.staticPath) {
                if (dir.env && dir.env !== currentEnv) {
                    continue;
                }

                const copyTo = dir.staticOutDir && dir.staticOutDir.startsWith('/')
                    ? path.join(outDir, dir.staticOutDir)
                    : path.join(path.dirname(singleBundle.name), dir.staticOutDir ? dir.staticOutDir : '');
                // merge global exclude glob with static path exclude glob
                const excludeGlob = (config.excludeGlob || []).concat((dir.excludeGlob || []));

                if (!fs.existsSync(copyTo)) {
                    fs.mkdirSync(copyTo, {recursive: true});
                }

                
                const copyFrom = path.join(pkg.pkgdir, dir.staticPath);
                if (fs.existsSync(copyFrom)) {
                    const stats = fs.statSync(copyFrom);
                    if (stats.isDirectory()) {
                        copyDir(copyFrom, copyTo, excludeGlob);
                    } else {
                        copyFile(copyFrom, copyTo, excludeGlob);
                    }
                } else {
                    pmLog(2, `Static directory or file '${copyFrom}' does not exist. Skipping.`);
                }
            }
        }

        if (!bundle.name) { // multiple entry points
            for (let singleBundle of bundler.mainBundle.childBundles.values()) {
                processStaticFiles(singleBundle);
            }
        } else {
            processStaticFiles(bundle);
        }

        if (config.watcherGlob && bundler.watcher) {
            pmLog(3, `Watching for changes in ${numWatches} static files.`);
        }

    });
};
