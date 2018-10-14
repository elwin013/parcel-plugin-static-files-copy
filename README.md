# parcel-plugin-static-files-copy [![Build Status](https://travis-ci.org/elwin013/parcel-plugin-static-files-copy.svg?branch=master)](https://travis-ci.org/elwin013/parcel-plugin-static-files-copy)

ParcelJS plugin to copy static files from some dir to directory with bundle.

## Install

```
yarn add parcel-plugin-static-files-copy --dev
```

## Usage

1. Create `static` dir in you project root.
2. Fill it with your static files
3. Run build - and that's all!

### Customization options

> The plugin allows you to name the forder whose contents should be present in the build output directory.

Customize the folder from where static resources need to be copied using the `staticPath` parameter in package.json file. `staticPath` can both be a plain string, or an array of directories, eg. `["public", "vendor/public"]`.

```json
// package.json

{
	...
    "staticPath": "public"
}
```
or
```json
// package.json

{
	...
    "staticPath": ["public", "vendor/public"]
}
```

## Contribute

You're interested in contributing? Awesome! Fork, make change, commit and create pull request. I'll do my best to merge changes!

## License

[MIT](/LICENSE)