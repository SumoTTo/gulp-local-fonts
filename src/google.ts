import { type GoogleOptions, type Options } from './types';
import { GOOGLE_OPTIONS_DEFAULT, PLUGIN_NAME } from './constants';
import Vinyl from 'vinyl';
import {
	fetch,
	getCssWithReplacedFontMatches,
	getFontFilesData,
	getFontUris,
	plugin,
} from './utils';
import PluginError from 'plugin-error';

function getGoogleUrl(
	fontsData: Array<string>,
	googleOptions: GoogleOptions
): string {
	const formatFonts = [];
	const urlData = [];

	fontsData.forEach((font) => {
		const parts = font.split(':');
		parts[0] = encodeURIComponent(parts[0]).replace(/%20/g, '+');
		if (parts.length === 2) {
			parts[1] = parts[1]
				.split(',')
				.map((type) => encodeURIComponent(type))
				.join(',');
			formatFonts.push(parts.join(':'));
		} else {
			formatFonts.push(parts[0]);
		}
	});
	urlData.push('family=' + formatFonts.join('|'));

	if (googleOptions.display) {
		urlData.push('display=' + encodeURIComponent(googleOptions.display));
	}
	if (googleOptions.subset) {
		urlData.push('subset=' + encodeURIComponent(googleOptions.subset));
	}
	if (googleOptions.effect) {
		urlData.push('effect=' + encodeURIComponent(googleOptions.effect));
	}
	if (googleOptions.text) {
		urlData.push('text=' + encodeURIComponent(googleOptions.text));
	}

	return `${encodeURI(googleOptions.url)}?${urlData.join('&')}`;
}

async function getGoogleCss(url: string): Promise<string> {
	const response = await fetch(url);

	if (!response.ok) {
		plugin().emit(
			'error',
			new PluginError(
				PLUGIN_NAME,
				`Unexpected response "${response.statusText}" for ${url}`
			)
		);
	}

	return response.text();
}

export default async function getGoogle(
	fontsData: Array<string>,
	options: Options
): Promise<{ googleFiles: Vinyl.BufferFile[]; googleCss: string }> {
	const googleOptions = Object.assign(GOOGLE_OPTIONS_DEFAULT, options.google);
	const url = getGoogleUrl(fontsData, googleOptions);
	const css = await getGoogleCss(url);
	const fontUrls = getFontUris(css);

	const { fontFiles, fontPaths, fontNames } = await getFontFilesData(
		fontUrls
	);

	return {
		googleFiles: fontFiles,
		googleCss: `/*${url}*/\r\n${getCssWithReplacedFontMatches(
			css,
			fontUrls,
			fontPaths,
			fontNames
		)}`,
	};
}
