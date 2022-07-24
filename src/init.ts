import { type FontsJson, type Options } from './types';
import Vinyl from 'vinyl';
import {
	maybeCssTransform,
	maybeJsTransform,
	plugin,
	setFetchInit,
} from './utils';
import getGoogle from './google';
import getLocal from './local';
import PluginError from 'plugin-error';
import { PLUGIN_NAME } from './constants';

export default async function init(
	json: FontsJson,
	options: Options,
	basePath: string
): Promise<Vinyl.BufferFile[]> {
	let css = '';
	const allFontNames = [];
	const vinylFiles = [];

	setFetchInit(options.nodeFetchOptions);
	if (typeof json.google !== 'undefined') {
		if (json.google instanceof Array) {
			if (json.google.length > 0) {
				const { googleFiles, googleCss, fontNames } = await getGoogle(
					json.google,
					options
				);
				googleFiles.forEach((googleFile) => {
					vinylFiles.push(googleFile);
				});
				css += googleCss;
				allFontNames.push(...Object.values(fontNames));
			}
		} else {
			plugin().emit(
				'warning',
				new PluginError(PLUGIN_NAME, 'Google option must be an array.')
			);
		}
	}

	if (typeof json.local !== 'undefined') {
		if (json.local instanceof Array) {
			if (json.local.length > 0) {
				const { localFiles, localCss, fontNames } = await getLocal(
					json.local,
					basePath
				);
				localFiles.forEach((localFile) => {
					vinylFiles.push(localFile);
				});
				css += localCss;
				allFontNames.push(...Object.values(fontNames));
			}
		} else {
			plugin().emit(
				'warning',
				new PluginError(PLUGIN_NAME, 'Local option must be an array.')
			);
		}
	}

	if (css) {
		const cssFile = new Vinyl({
			path: 'fonts.css',
			contents: Buffer.from(maybeCssTransform(css, options.cssTransform)),
		});
		vinylFiles.push(cssFile);
	}

	if (allFontNames.length) {
		const js =
			`const a=document.documentElement.classList;` +
			`['${allFontNames.sort().join("','")}'].forEach((b)=>{` +
			`const c=b.toLowerCase().replaceAll(' ','-');` +
			`if(document.fonts.check('16px '+b)){` +
			`a.add('done-'+c);` +
			`}else{` +
			`document.fonts.load('16px '+b).then(()=>a.add('done-'+c)).catch(()=>a.add('error-'+c));` +
			`}` +
			`});`;

		const jsFile = new Vinyl({
			path: 'fonts.js',
			contents: Buffer.from(
				maybeJsTransform(js, allFontNames, options.jsTransform)
			),
		});
		vinylFiles.push(jsFile);
	}

	return vinylFiles;
}
