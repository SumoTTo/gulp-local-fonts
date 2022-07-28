import findCacheDir from 'find-cache-dir';
import { type GoogleOptions, type Options } from './types';

export const PLUGIN_NAME: string = 'gulp-local-fonts';
export const CACHE_DIR: string = findCacheDir({ name: PLUGIN_NAME });

export const OPTIONS_DEFAULT: Options = {
	cache: true,
	google: {},
	nodeFetchOptions: {
		headers: {
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
		},
	},
	createdJsFiles: true,
};

export const GOOGLE_OPTIONS_DEFAULT: GoogleOptions = {
	url: 'https://fonts.googleapis.com/css',
	display: 'swap',
	text: 'abcdefghijklmnopqrstuvwxyz-ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789,.!?&%$#@;:/|\\\'"`^{}[]()<>+=*~',
	subset: false,
	effect: false,
};
