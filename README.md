# Local Fonts

Loads fonts from Google Fonts CSS or locally CSS based on JSON file.

## Installation

You can install the package as follows:

```sh
npm install @sumotto/gulp-local-fonts --save-dev

# or

yarn add @sumotto/gulp-local-fonts --dev
```

## Usage

```js
const { src, dest, task } = require('gulp');
const localFonts = require('@sumotto/gulp-local-fonts');

task('fonts', function () {
  return src('./src/fonts.json')
    .pipe(localFonts())
    .pipe(dest('./dist/fonts/'));
});
```

```js
import { src, dest, task } from 'gulp';
import localFonts from '@sumotto/gulp-local-fonts';

task('fonts', function () {
  return src('./src/fonts.json')
    .pipe(localFonts())
    .pipe(dest('./dist/fonts/'));
});
```

## JSON file format sample

```json
{
  "google": [
    "Roboto",
    "Open Sans",
    "Lato:100,200,300,400,500,600,700,800,900,italic,bold,bolditalic"
  ],
  "local": [
    "fonts/fonts.css"
  ]
}
```

## Options

```js
task('fonts', function () {
  return src('./src/fonts.json')
    .pipe(localFonts({
      cache: true,
      google: {
        url: 'https://fonts.googleapis.com/css',
        display: 'swap',
        text: 'abcdefghijklmnopqrstuvwxyz-ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789,.!?&%$#@;:/|\'"`^{}[]()<>+=*~',
        subset: false,
        effect: false,
      },
      cssTransform: false,
      nodeFetchOptions: {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
        },
      },
    }))
    .pipe(dest('./dist/fonts/'));
});
```

### cache

Type: `string | string[]`\
Default: `true`

If true, then the files are collected and written to the cache, and on next runs of the Gulp task the JSON has not
changed,
the files will be taken from the cache, if the JSON has changed the files will be re-generated.

If false files will be generated every time the Gulp task is run.

### google

Type: `object`

The parameters correspond to the [Google Fonts API](https://developers.google.com/fonts/docs/getting_started).

#### url

Type: `string`\
Default: `https://fonts.googleapis.com/css`

#### display

Type: `string | string[]`\
Default: `swap`

#### text

Type: `string | false`\
Default: ```abcdefghijklmnopqrstuvwxyz-ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789,.!?&%$#@;:/|\'"`^{}[]()<>+=*~```

#### subset

Type: `string | false`\
Default: `false`

#### effect

Type: `string | false`\
Default: `false`

### cssTransform

Type: `Function<(css: string) => string> | false`\
Default: `false`

You can pass some function that will receive the generated CSS as input, you can change it and return it.
For example, use the [CSSO CSS minifier](https://www.npmjs.com/package/csso).

```js
import { minify } from 'csso'; // npm install csso

task('fonts', function () {
  return src('./src/fonts.json')
    .pipe(localFonts({
      cssTransform: (css) => minify(css).css,
    }))
    .pipe(dest('./dist/fonts/'));
});
```

### nodeFetchOptions

Type: `object`\
Default:

```
{
  headers: {
    'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
  },
}
```

The parameters correspond to the [Node Fetch Options](https://www.npmjs.com/package/node-fetch#options).

## License

MIT License
