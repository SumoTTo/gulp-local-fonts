import { type Options } from './types';
import Vinyl from 'vinyl';
import PluginError from 'plugin-error';
import { default as through, TransformCallback } from 'through2';
import { OPTIONS_DEFAULT, PLUGIN_NAME } from './constants';
import { getFontJson, plugin, setPlugin } from './utils';
import cache from './cache';
import init from './init';

// noinspection JSUnusedGlobalSymbols
export default function gulpLocalFonts(optionsGulpLocalFonts: Options = {}) {
	const options = Object.assign(OPTIONS_DEFAULT, optionsGulpLocalFonts);

	return through(
		{ objectMode: true },
		async function (
			file: Vinyl.BufferFile,
			encoding: string,
			callback: TransformCallback
		) {
			setPlugin(this);
			if (!file.isNull() && '.json' === file.extname) {
				if (file.isStream()) {
					plugin().emit(
						'error',
						new PluginError(PLUGIN_NAME, 'Streams not supported!')
					);
				} else if (file.isBuffer()) {
					const json = getFontJson(file.contents.toString());
					const vinylFiles = options.cache
						? await cache(json, options, file.base)
						: await init(json, options, file.base);

					vinylFiles.forEach((vinylFile) => this.push(vinylFile));
				}
			} else {
				this.push(file);
			}

			return callback(null, null);
		}
	);
}
