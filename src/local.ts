import Vinyl from 'vinyl';
import { dirname, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import {
	getCssWithReplacedFontMatches,
	getFontFilesData,
	getFontUris,
	plugin,
} from './utils';
import PluginError from 'plugin-error';
import { PLUGIN_NAME } from './constants';

async function getLocalCss(
	paths: Array<string>,
	basePath: string
): Promise<string> {
	return paths
		.map((path) => {
			const absoluteCssPath = resolve(basePath, path);

			if (!existsSync(absoluteCssPath)) {
				plugin().emit(
					'error',
					new PluginError(PLUGIN_NAME, 'Local font css not found!')
				);

				return '';
			}

			let css = readFileSync(absoluteCssPath, 'utf-8');
			const fontMatchesAll = css.matchAll(
				/url\((?<quote>['"]?)(?<uri>[^)"':]+?)(\??#[^)"']+)?\k<quote>\)/g
			);

			Array.from(fontMatchesAll, (m) => m.groups.uri).forEach(
				(relativeFontPath) => {
					const absoluteFontPath = resolve(
						dirname(absoluteCssPath),
						relativeFontPath
					).replace(/\\/g, '/');
					css = css.replace(relativeFontPath, absoluteFontPath);
				}
			);

			return css;
		})
		.join('\r\n');
}

export default async function getLocal(
	fontsData: Array<string>,
	basePath: string
): Promise<{
	localFiles: Vinyl.BufferFile[];
	localCss: string;
}> {
	const css = await getLocalCss(fontsData, basePath);
	const fontUrls = getFontUris(css);
	const { fontFiles, fontPaths, fontNames } = await getFontFilesData(
		fontUrls
	);

	return {
		localFiles: fontFiles,
		localCss: getCssWithReplacedFontMatches(
			css,
			fontUrls,
			fontPaths,
			fontNames
		),
	};
}
