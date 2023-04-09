import { type FontsJson, type Options } from './types';
import Vinyl from 'vinyl';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import {
	maybeCssTransform,
	maybeJsTransform,
	plugin,
	setFetchInit,
	toCamelCase,
	isNumber,
} from './utils';
import getGoogle from './google';
import getLocal from './local';
import PluginError from 'plugin-error';
import { PLUGIN_NAME } from './constants';
import { fileURLToPath } from 'url';

if (typeof __dirname === 'undefined') {
	// noinspection ES6ConvertVarToLetConst
	var __dirname = dirname(fileURLToPath(import.meta.url)); // eslint-disable-line no-var
}

export default async function init(
	json: FontsJson,
	options: Options,
	basePath: string
): Promise<Vinyl.BufferFile[]> {
	let css = '';
	const vinylFiles = [];

	setFetchInit( options.nodeFetchOptions );
	if ( typeof json.google !== 'undefined' ) {
		if ( json.google instanceof Array ) {
			if ( json.google.length > 0 ) {
				const { googleFiles, googleCss } = await getGoogle(
					json.google,
					options
				);
				googleFiles.forEach( ( googleFile ) => {
					vinylFiles.push( googleFile );
				} );
				css += googleCss;
			}
		} else {
			plugin().emit(
				'warning',
				new PluginError( PLUGIN_NAME, 'Google option must be an array.' )
			);
		}
	}

	if ( typeof json.local !== 'undefined' ) {
		if ( json.local instanceof Array ) {
			if ( json.local.length > 0 ) {
				const { localFiles, localCss } = await getLocal(
					json.local,
					basePath
				);
				localFiles.forEach( ( localFile ) => {
					vinylFiles.push( localFile );
				} );

				css += localCss;
			}
		} else {
			plugin().emit(
				'warning',
				new PluginError( PLUGIN_NAME, 'Local option must be an array.' )
			);
		}
	}

	if ( css ) {
		const transformCss = await maybeCssTransform( css, options.cssTransform );
		const cssFile = new Vinyl( {
			path: 'fonts.css',
			contents: Buffer.from( transformCss ),
		} );
		vinylFiles.push( cssFile );

		if ( options.createdJsFiles ) {
			const fontFaces = css.match( /(?<={)([^}]+)(?=})/gm );

			if ( fontFaces && fontFaces.length ) {
				const fontFacesData = {};
				fontFaces.forEach( function( fontFace ) {
					const fontKey = [
						'',
						400,
						'normal',
					];
					const fontFaceData = [
						'',
						'',
						{},
					];
					const fontFaceProperties = fontFace
						.trim()
						.split( ';' )
						.map( function( property ) {
							return property
								.split( ':' )
								.map( ( part ) => part.trim() );
						} );

					fontFaceProperties.forEach( function(
						[
							propertyName,
							rawPropertyValue,
						]
					) {
						if ( propertyName && rawPropertyValue ) {
							const propertyValue = isNumber( rawPropertyValue )
								? parseFloat( rawPropertyValue )
								: rawPropertyValue.replace(
									/^['"]+|['"]+$/g,
									''
								);

							if ( 'font-family' === propertyName ) {
								fontFaceData[ 0 ] = propertyValue;

								fontKey[ 0 ] = propertyValue
									.toString()
									.toLowerCase()
									.replace( /\s+/g, '-' );
							} else if ( 'src' === propertyName ) {
								fontFaceData[ 1 ] = propertyValue
									.toString()
									.replace( /,\s*url/g, ', url' );
							} else {
								if ( 'font-weight' === propertyName ) {
									fontKey[ 1 ] = parseInt(
										propertyValue.toString()
									);
								} else if ( 'font-style' === propertyName ) {
									fontKey[ 2 ] = propertyValue;
								}

								fontFaceData[ 2 ][
									toCamelCase(
										propertyName.replace( /^font-/, '' )
									)
								] = propertyValue;
							}
						}
					} );

					fontFacesData[ fontKey.join( '-' ) ] = fontFaceData;
				} );

				const jsFileNames = [
					'fonts.js',
					'fonts-all.js',
					'fonts-classes.js',
					'fonts-get-format-from-font-data.js',
					'fonts-get-key-from-font-face.js',
					'fonts-get-src-from-font-data.js',
					'fonts-load.js',
					'fonts-preloader-main.js',
					'fonts-preloader-worker.js',
				];

				for ( const jsFileName of jsFileNames ) {
					let js = readFileSync(
						join( __dirname, 'js', jsFileName )
					).toString();

					if ( 'fonts.js' === jsFileName ) {
						js = js.replace( '{}', JSON.stringify( fontFacesData ) );
					} else if ( 'fonts-all.js' === jsFileName ) {
						js = js.replace( '// const fontsData', 'const fontsData = ' + JSON.stringify( fontFacesData ) + ';' );
						js = js.replace( '// fonts-load.js', readFileSync(
							join( __dirname, 'js', 'fonts-load.js' )
						).toString().replace( "import fontsData from './fonts.js';", '' ) );
						js = js.replace( '// fonts-get-key-from-font-face.js', readFileSync(
							join( __dirname, 'js', 'fonts-get-key-from-font-face.js' )
						).toString().replace( 'export default ', '' ) );
						js = js.replace( '// fonts-classes.js', readFileSync(
							join( __dirname, 'js', 'fonts-classes.js' )
						).toString()
							.replace( "import fontsData from './fonts.js';", '' )
							.replace( "import fontsGetKeyFromFontFace from './fonts-get-key-from-font-face.js';", '' ) );
					}

					const jsFile = new Vinyl( {
						path: jsFileName,
						contents: Buffer.from(
							await maybeJsTransform(
								js,
								jsFileName,
								css,
								options.jsTransform
							)
						),
					} );
					vinylFiles.push( jsFile );
				}
			}
		}
	}

	return vinylFiles;
}
