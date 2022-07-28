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
    "Lato:100,100i,300,300i,400,400i,700,700i,900,900i"
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
      createdJsFiles: true,
      jsTransform: false,
    }))
    .pipe(dest('./dist/fonts/'));
});
```

### cache

Type: `boolean`\
Default: `true`

If true, then the files are collected and written to the cache, and on next runs of the Gulp task the JSON has not
changed, the files will be taken from the cache, if the JSON has changed the files will be re-generated.

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
      cssTransform: ({ css }) => minify(css).css,
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

### createdJsFiles

Type: `boolean`\
Default: `true`

Determines if additional JS files need to be generated. These files are described below.

### jsTransform

Type: `Function<(js: string, fileName: string, css: string) => string> | false`\
Default: `false`

You can pass some function that will receive the generated JS as input, you can change it and return it. This function
will be applied to all JS files separately. Additionally, the function receives the file name as the second parameter,
and the generated css as the third. For example, use the [Terser](https://www.npmjs.com/package/terser).

```js
import { minify } from 'terser'; // npm install terser

task('fonts', function () {
  return src('./src/fonts.json')
    .pipe(localFonts({
      jsTransform: async ({ js }) => ( await minify(js, { module: true }) ).code,
    }))
    .pipe(dest('./dist/fonts/'));
});
```

## Output JS files

### fonts.js

Contains an object with font data.

#### Example:

```js
export default {
  "barlow-100-italic": [
    "Barlow",
    "local('Barlow Thin Italic'), url(Barlow-ThinItalic.woff2) format('woff2')",
    { "style": "italic", "weight": 100, "display": "swap" },
  ],
  "barlow-800-normal": [
    "Barlow",
    "local('Barlow ExtraBold'), url(Barlow-ExtraBold.woff2) format('woff2')",
    { "style": "normal", "weight": 800, "display": "swap" },
  ],
}
```

Used in fonts-classes.js, fonts-load.js and fonts-preloader-main.js.

### fonts-classes.js

Handles font load events and sets classes on <html>.
Class format: `font-{fontFamily}-{fontWeight}-{fontStyle}-{done|error}`

#### Using in HTML

```html

<script src="fonts-classes.js" type="module" async></script>
```

### fonts-get-format-from-font-data.js

Gets the font format based on its data.

Used in fonts-preloader-main.js.

### fonts-get-key-from-font-face.js

Gets the font key based on its data.

Used in fonts-classes.js and fonts-preloader-main.js.

### fonts-get-src-from-font-data.js

Gets the SRC of a font based on its data.

Used in fonts-preloader-main.js.

### fonts-load.js

Loads fonts without using the fonts.css file.

#### Using in HTML

```html

<script src="fonts-load.js" type="module" async></script>
```

### fonts-preloader-main.js

If you use different fonts on different pages, or some of them do not use all font options, and you want to load preload
fonts. Then you can send a list of fonts needed for the initial page of a particular page. You will need to write a
server script that will take an array of fonts and save them to the server for each page.

#### Using

```html

<script src="fonts-preloader-main.js" data-fonts-preloader-fetch-url="url-to-save-data" type="module" async></script>
```

A POST request ('Content-Type': 'application/json;charset=utf-8') with font data, will be sent to the URL specified in
data-fonts-preloader-fetch-url.

```json
{
  "fonts": [
    {
      "src": "Barlow-ThinItalic.woff2",
      "type": "woff2"
    }
  ]
}
```

### fonts-preloader-worker.js

A worker that sends font data to the endpoint.

Used in fonts-preloader-main.js.

### Using in WordPress

Class contains the operation logic for connecting and saving data for the preloader.
It is calculated that your fonts are in the child theme in the "fonts" folder.

class-theme-fonts.php

```php
<?php
class Theme_Fonts {
	protected const META_KEY       = '_theme_preload_fonts';
	protected const REST_NAMESPACE = '/theme/v1/';
	protected const REST_ROUTE     = 'fonts-preloader/';

	protected static array $preload_fonts = array();
	protected static array $preload_js    = array(
		'fonts-classes.js',
		'fonts.js',
		'fonts-get-key-from-font-data.js',
	);

	public static function init( $type ) : void {
		if ( 'css' === $type ) {
			add_action(
				'wp_head',
				array( static::class, 'add_fonts_css' ),
				- 10
			);
		} else {
			array_unshift( static::$preload_js, 'fonts-load.js' );
			add_action(
				'wp_head',
				array( static::class, 'add_fonts_js' ),
				- 10
			);
		}

		add_action(
			'wp',
			array( static::class, 'set_preload_fonts' ),
		);
		add_action(
			'wp',
			array( static::class, 'the_preload_headers' ),
			11
		);
		add_action(
			'wp_head',
			array( static::class, 'the_preload_links' ),
			- 20
		);
		add_action(
			'rest_api_init',
			array( static::class, 'registration_rest_routes' )
		);
	}

	public static function add_fonts_js() : void {
		$font_dir   = get_stylesheet_directory() . '/fonts/';
		$js_content = WLD_Filesystem::get_file_contents( $font_dir . 'fonts.js' );
		if ( $js_content ) {
			static::the_classes_script();
			printf(
				'<script src="%s" id="theme-fonts-load-js" type="module" async></script>',
				esc_url( static::get_url( 'fonts-load.js' ) )
			);
			static::the_save_preload_script();
		}
	}

	public static function add_fonts_css() : void {
		$font_dir    = get_stylesheet_directory() . '/fonts/';
		$css_content = WLD_Filesystem::get_file_contents( $font_dir . 'fonts.css' );
		if ( $css_content ) {
			$font_url = static::get_url();
			static::the_classes_script();
			printf(
				'<style id="theme-fonts-css">%s</style>',
				str_replace(
					'url(',
					'url(' . esc_url( $font_url ),
					$css_content
				)
			);
			static::the_save_preload_script();
		}
	}

	public static function set_preload_fonts() : void {
		$preload_fonts = get_post_meta( get_the_ID(), static::META_KEY, true );
		if ( is_array( $preload_fonts ) ) {
			static::$preload_fonts = $preload_fonts;
		}
	}

	public static function the_preload_links() : void {
		if ( static::$preload_js ) {
			foreach ( static::$preload_js as $js ) {
				echo sprintf(
					'<link rel="preload" href="%s" as="script" crossorigin>',
					esc_url( static::get_url( $js ) ),
				);
			}
		}
		if ( static::$preload_fonts ) {
			foreach ( static::$preload_fonts as $font ) {
				echo sprintf(
					'<link rel="preload" href="%s" as="font" type="%s" crossorigin>',
					esc_url( static::get_url( $font['src'] ) ),
					esc_attr( 'font/' . $font['type'] )
				);
			}
		}
	}

	public static function the_preload_headers() : void {
		if ( wp_doing_ajax() ) {
			return;
		}

		if ( static::$preload_js ) {
			foreach ( static::$preload_js as $js ) {
				header(
					sprintf(
						'Link: <%s>; rel=preload; as=script; crossorigin"',
						esc_url_raw( static::get_url( $js ) ),
					),
					false
				);
			}
		}
		if ( static::$preload_fonts ) {
			foreach ( static::$preload_fonts as $font ) {
				header(
					sprintf(
						'Link: <%s>; rel=preload; as=font; type="%s"; crossorigin"',
						esc_url_raw( static::get_url( $font['src'] ) ),
						'font/' . $font['type']
					),
					false
				);
			}
		}
	}

	public static function save_preload_fonts( WP_REST_Request $request ) : WP_REST_Response {
		update_post_meta( $request['post_id'], static::META_KEY, $request['fonts'] );

		return new WP_REST_Response( 'Saved' );
	}

	public static function registration_rest_routes() : void {
		register_rest_route(
			static::REST_NAMESPACE,
			static::REST_ROUTE . '(?P<post_id>\d+)',
			array(
				'methods'             => 'POST',
				'callback'            => array( static::class, 'save_preload_fonts' ),
				'permission_callback' => static function () {
					return current_user_can( 'manage_options' );
				},
				'args'                => array(
					'fonts' => array(
						'type'        => 'array',
						'uniqueItems' => true,
						'items'       => array(
							'type'       => 'object',
							'properties' => array(
								'src'  => array(
									'type'    => 'string',
									'pattern' => '^[[:alnum:]-]+.(eot|svg|ttf|woff2?)$',
								),
								'type' => array(
									'type' => 'string',
									'enum' => array(
										'eot',
										'svg',
										'opentype',
										'truetype',
										'woff',
										'woff2',
									),
								),
							),
						),
						'required'    => true,
					),
				),
			)
		);
	}

	protected static function get_url( $file_name = '' ) : string {
		static $font_url;
		if ( null === $font_url ) {
			$font_url = get_stylesheet_directory_uri() . '/fonts/';
		}

		return $font_url . $file_name;
	}

	protected static function the_classes_script() : void {
		printf(
			'<script src="%s" id="theme-fonts-classes-js" type="module" async></script>',
			esc_url( static::get_url( 'fonts-classes.js' ) )
		);
	}

	protected static function the_save_preload_script() : void {
		if ( current_user_can( 'manage_options' ) ) {
			printf(
				'<script src="%s" data-fonts-preloader-fetch-url="%s" id="theme-fonts-preloader-main-js" type="module" async></script>',
				esc_url( static::get_url( 'fonts-preloader-main.js' ) ),
				esc_url(
					wp_nonce_url(
						get_rest_url(
							null,
							static::REST_NAMESPACE . static::REST_ROUTE . get_the_ID()
						),
						'wp_rest'
					)
				)
			);
		}
	}
}
```

functions.php

```php
<?php
// Include a class file.
require get_stylesheet_directory() . '/inc/class-theme-fonts.php';

// Select the best option for you.
// Initialize with font connection via css.
Theme_Fonts::init( 'css' );

// Or initialize with font connection via js.
Theme_Fonts::init( 'js' );
```

## License

MIT License
