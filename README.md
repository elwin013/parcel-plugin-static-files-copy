# parcel-plugin-static-files-copy [![Build Status](https://travis-ci.org/elwin013/parcel-plugin-static-files-copy.svg?branch=master)](https://travis-ci.org/elwin013/parcel-plugin-static-files-copy)

ParcelJS plugin to copy static files from some directory to directory with bundle.

## Install

```
yarn add parcel-plugin-static-files-copy --dev
```

## Usage

1. Create `static` directory in you project root.
2. Fill it with your static files
3. Run build - and that's all!

## Customization

Beyond the default settings, you can:

1. Name of the directory to be copied.
2. Copy multiple directory.
3. Copy different directory based on different output directory.
3. Watch for changes during development (rebuilding when necessary).

### Example

The following configures the plugin to copy all files in `public` to the build directory and watch for changes in all source files (`**` is a deep wildcard).

```json
// package.json
{
	...
    "staticFiles": {
        "staticPath": "public",
        "watcherGlob": "**"
    }
}
```

### Multiple Static Directories

To copy more than one directory to the build directory, specify `staticPath` as an array. The following copies `public` and `vendor/public`:

```json
// package.json
{
	...
    "staticFiles": {
        "staticPath": ["public", "vendor/public"]
    }
}
```

### Different source of static files based on output directory

To copy different files (from different directories) based on output directory (e.g. `--out-dir dist1` and `--out-dir dist2`) make `staticPath` a object:

```json
// package.json
{
    ...
    "staticFiles": {
        "staticPath": [
            {
                "outDirPattern": "**/dist1",
                "staticPath": "static1"
            },
            {
                "outDirPattern": "**/dist2",
                "staticPath": "static2"
            }
        ]
  },
}
```

### Watching for Changes

Parcel can rebuild your bundle(s) whenever changes occur in the static directory. This is disabled by default, but it can be enabled by specifying a glob pattern for files that shoudl be watched.

Note the relative file path is used in matching (not just the file name). To match filenames in deep directories, start with a "globstar" (double star). The plugin uses Node's built-in [Minimatch Library](https://github.com/isaacs/minimatch) for glob matching.

The following watches all XML files in the static directory:

```json
// package.json
{
	...
    "staticFiles": {
        "staticPath": "public",
        "watcherGlob": "**/*.xml"
    }
}
```

To disable watching, either remove the `"watcherGlob"` key (disabled is the default) or set it to false/null/undefined:

```json
// package.json
{
	...
    "staticFiles": {
        "staticPath": "public",
        "watcherGlob": false
    }
}
```

## Contribute

You're interested in contributing? Awesome! Fork, make change, commit and create pull request. I'll do my best to merge changes!

## License

[MIT](/LICENSE)
