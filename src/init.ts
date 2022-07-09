import { type FontsJson, type Options } from './types';
import Vinyl from 'vinyl';
import { maybeCssTransform, plugin, setFetchInit } from './utils';
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
	const vinylFiles = [];

	setFetchInit(options.nodeFetchOptions);
	if (typeof json.google !== 'undefined') {
		if (json.google instanceof Array) {
			if (json.google.length > 0) {
				const { googleFiles, googleCss } = await getGoogle(
					json.google,
					options
				);
				googleFiles.forEach((googleFile) => {
					vinylFiles.push(googleFile);
				});
				css += googleCss;
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
				const { localFiles, localCss } = await getLocal(
					json.local,
					basePath
				);
				localFiles.forEach((localFile) => {
					vinylFiles.push(localFile);
				});
				css += localCss;
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

	return vinylFiles;
}
