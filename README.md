# parcel-plugin-static-files-copy

ParcelJS plugin to copy static files from some (currently only from `static` in project root) dir
to directory with bundle.

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

Customize the folder from where static resources need to be copied using the `staticPath` parameter in package.json file.

```json
// package.json

{
	...
    "staticPath": "public"
}
```

## Contribute

You're interested in contributing? Awesome! Fork, make change, commit and create pull request. I'll do my best to merge changes!

## License

[MIT](/LICENSE)