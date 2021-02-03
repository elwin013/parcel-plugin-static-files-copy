# parcel-plugin-static-files-copy

ParcelJS plugin to copy static files from some directory to directory with bundle.

### Looking for the ParcelV2 plugin? Check out [parcel-reporter-static-files-copy](https://github.com/elwin013/parcel-reporter-static-files-copy)

## Install

```
yarn add parcel-plugin-static-files-copy --dev
```

```
npm install -D parcel-plugin-static-files-copy
```

## Usage

1. Create `static` directory in you project root.
2. Fill it with your static files
3. Run build - and that's all!

## Customization

Beyond the default settings, you can:

1. Name of the directory to be copied.
2. Copy single files.
3. Copy multiple directories.
4. Copy from a different directory based on different output directory.
5. Watch for changes during development (rebuilding when necessary).
6. Exclude paths from copying.

### Example

The following configures the plugin to copy all files in `public` to the build directory and watch for changes 
in all source files (`**` is a deep wildcard).

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

To copy more than one directory to the build directory, specify `staticPath` as an array. The following copies 
`public` and `vendor/public`:

```json
// package.json
{
	...
    "staticFiles": {
        "staticPath": ["public", "vendor/public"]
    }
}
```

### Copying single files

To copy single file (instead of content of directory) just pass path to a file instead of directory.  

```json
// package.json
{
	...
    "staticFiles": {
        "staticPath": ["path/to/a/file.txt"]
    }
}
```

### Different source of static files based on output directory

To copy different files (from different directories) based on output directory (e.g. `--out-dir dist1` and `--out-dir dist2`) 
make `staticPath` a object:

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

### Specify directory to copy static files into

If you want your files from `staticPath` to get copied into a subdirectory inside the parcel `--out-dir`, make 
`staticPath` an object with `staticOutDir` key:

```json
// package.json
{
    ...
    "staticFiles": {
        "staticPath": [
            {
                "staticPath": "static1",
                "staticOutDir": "vendor"
            }
        ]
  },
}
```

Copies files from `static1` into the `vendor` directory inside the `--out-dir`.

### Watching for Changes

Parcel can rebuild your bundle(s) whenever changes occur in the static directory. This is disabled by default, but it 
can be enabled by specifying a glob pattern for files that should be watched.

Note the relative file path is used in matching (not just the file name). To match filenames in deep directories, 
start with a "globstar" (double star). The plugin uses Node's built-in [Minimatch Library](https://github.com/isaacs/minimatch) 
for glob matching.

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

### Excluding paths

You can exclude files and directories in your `staticPath` from getting copied to the `outDir` by specifying `excludeGlob`:

```json
// package.json
{
    ...
    "staticFiles": {
        "staticPath": "public",
        "excludeGlob": "**/*.md"
    }
}
```

Excludes all `.md` files in the `public` path from getting copied.


Multiple `excludeGlob`s are possible by specifying it as array:

```json
// package.json
{
	...
    "staticFiles": {
        "staticPath": "public",
        "excludeGlob": ["docs", "docs/**"]
    }
}
```

Excludes the `docs` directory and all files inside the `docs` directory from getting copied.


### Including paths

You can use the `excludeGlob` and negate it to achieve including behavior:


```json
// package.json
{
    ...
    "staticFiles": {
        "staticPath": "src",
        "excludeGlob": "**/!(locales)/*.+(!(txt)|!(json))"
    }
}
```

Includes only files from `locales` directory with `.txt` or `.json` extension.


### Minimatch glob options

Passing [options into minimatch](https://github.com/isaacs/minimatch#options) to change `watcherGlob` and `excludeGlob` 
behavior is possible by specifying a `globOptions` object:

```json
// package.json
{
    ...
    "staticFiles": {
        "staticPath": "public",
        "excludeGlob": ["test", "test/**"],
        "globOptions": {
            "dot": true
        }
    }
}
```

Excludes the `test` directory and all files inside the `test` directory, including files starting with a dot, from 
getting copied.

### Dev and production config using NODE_ENV

You can use `env` parameter in `staticPath` object to select static path used in environment chosen by passing `NODE_ENV`:

```json
// package.json
{
    ...
      "scripts": {
        "build:dev": "NODE_ENV=dev parcel build src/index.html",
        "build:prod": "NODE_ENV=prod parcel build src/index.html"
      },
    ...
      "staticFiles": {
        "staticPath": [
          {
            "staticPath": "static-dev",
            "env": "dev"
          },
          {
            "staticPath": "static-prod",
            "env": "prod"
          }
        ]
      }
}
```

Then running:
* `build:dev` will copy files from `static-dev` only,
* `build:prod` will copy files from `static-prod` only.

You can specify from zero to many static paths per environment.

### Additional examples

Check [examples](https://github.com/elwin013/parcel-plugin-static-files-copy/tree/master/examples) directory for 
additional examples. 

## Contribute

Are you interested in contributing? Awesome! Fork, make change, commit and create pull request. I'll do my best to merge 
changes!

## License

[MIT](/LICENSE)
