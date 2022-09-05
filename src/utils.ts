import {
	CssTransformFunction,
	FontFamilyNames,
	FontFullNames,
	FontPaths,
	FontsJson,
	JsTransformFunction,
} from './types';
import { type Readable } from 'stream';
import Vinyl from 'vinyl';
import nodeFetch, {
	type RequestInfo,
	type RequestInit,
	Response,
} from 'node-fetch';
import { create as getFontData } from 'fontkit';
import { basename, extname } from 'path';
import { readFileSync } from 'fs';
import PluginError from 'plugin-error';
import { PLUGIN_NAME, WEIGHTS } from './constants';

let fetchInit: RequestInit;
let pluginSelf: Readable;

function arrayUnique(
	value: string,
	index: number,
	self: Array<string>
): boolean {
	return self.indexOf(value) === index;
}

function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function setFetchInit(customFetchInit: RequestInit) {
	fetchInit = customFetchInit;
}

export function fetch(url: RequestInfo): Promise<Response> {
	return nodeFetch(url, fetchInit);
}

export function setPlugin(self: Readable) {
	pluginSelf = self;
}

export function plugin(): Readable {
	return pluginSelf;
}

export function getCssWithReplacedFontMatches(
	css: string,
	fontUrls: Array<string>,
	fontPaths: FontPaths,
	fontFamilyNames: FontFamilyNames,
	fontFullNames: FontFullNames
): string {
	const matches = css.matchAll(/@font-face\s+{[^}]+}/g);
	return Array.from(matches, (m) => m[0])
		.map((fontMatch: string) => {
			fontUrls.forEach(function (fontUrl: string) {
				const fontPath = fontPaths[fontUrl];
				const fontFamilyName = fontFamilyNames[fontUrl];
				const fontFullName = fontFullNames[fontUrl];
				const fontRegExp = new RegExp(escapeRegExp(fontUrl), 'g');

				if (fontRegExp.test(fontMatch)) {
					fontMatch = fontMatch.replace(fontRegExp, fontPath);
					fontMatch = setLocalRulesInFontMatch(
						fontMatch,
						fontFamilyName,
						fontFullName
					);
				}
			});

			return fontMatch;
		})
		.join('\r\n');
}

export function getFontUris(css: string): Array<string> {
	const fontMatchesAll = css.matchAll(
		/url\((?<quote>['"]?)(?<uri>[^)"']+?)(\??#[^)"']+)?\k<quote>\)/g
	);

	return Array.from(fontMatchesAll, (m) => m.groups.uri).filter(arrayUnique);
}

async function getFontFileData(uri: string): Promise<{
	fontFile: Vinyl.BufferFile;
	fontFilePath: string;
	fontFamilyName: string;
	fontFullName: string;
}> {
	let buffer: Buffer;
	let fontFileExt: string;
	let fontPostscriptName: string;
	let fontFamilyName: string;
	let fontFullName: string;
	const isUrl = /^https?:\/\//.test(uri);

	if (isUrl) {
		const response = await fetch(uri);

		if (!response.ok) {
			plugin().emit(
				'error',
				new PluginError(
					PLUGIN_NAME,
					`Failed to load font from ${uri}. Status text: ${response.statusText}.`
				)
			);
		}

		buffer = Buffer.from(await response.arrayBuffer());
	} else {
		buffer = Buffer.from(readFileSync(uri, 'utf-8'));
	}

	try {
		const fontData = await getFontData(buffer);

		fontFileExt = `.${fontData.type.toLowerCase()}`;

		const failBack = basename(uri, fontFileExt);

		fontPostscriptName = fontData.postscriptName || failBack;
		fontFamilyName = fontData.familyName || failBack;
		fontFullName = fontData.fullName || failBack;
	} catch (error) {
		fontFileExt = extname(uri);

		const failBack = basename(uri, fontFileExt);

		fontPostscriptName = failBack;
		fontFamilyName = failBack;
		fontFullName = failBack;
	}

	const fontFileName = fontPostscriptName
		.replace(/[\s_-]+/g, '-')
		.replace(/[^a-zA-Z0-9-]/g, '');
	const fontFilePath = `${fontFileName}${fontFileExt}`;

	const fontFile = new Vinyl({
		path: fontFilePath,
		contents: buffer,
	});

	return {
		fontFile,
		fontFilePath,
		fontFamilyName,
		fontFullName,
	};
}

export async function getFontFilesData(fontUris: Array<string>): Promise<{
	fontFiles: Vinyl.BufferFile[];
	fontFamilyNames: FontFamilyNames;
	fontFullNames: FontFullNames;
	fontPaths: FontPaths;
}> {
	const fontFiles = [];
	const fontFamilyNames = {};
	const fontFullNames = {};
	const fontPaths = {};

	await Promise.all(
		fontUris.filter(arrayUnique).map(async (fontUri) => {
			const { fontFile, fontFilePath, fontFamilyName, fontFullName } =
				await getFontFileData(fontUri);

			fontFiles.push(fontFile);
			fontPaths[fontUri] = fontFilePath;
			fontFamilyNames[fontUri] = fontFamilyName;
			fontFullNames[fontUri] = fontFullName;
		})
	);

	return {
		fontFiles,
		fontFamilyNames,
		fontFullNames,
		fontPaths,
	};
}

export function getFontJson(json: string): FontsJson {
	return JSON.parse(json);
}

export async function maybeCssTransform(
	css: string,
	cssTransform: CssTransformFunction
): Promise<string> {
	if (cssTransform) {
		return cssTransform({ css });
	}

	return css;
}

export async function maybeJsTransform(
	js: string,
	fileName: string,
	css: string,
	jsTransform: JsTransformFunction
): Promise<string> {
	if (jsTransform) {
		return jsTransform({ js, fileName, css });
	}

	return js;
}

export function toCamelCase(str: string): string {
	return (
		str[0].toLowerCase() +
		str
			.slice(1)
			.toLowerCase()
			.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
	);
}

export function isNumber(str): boolean {
	return !isNaN(parseFloat(str)) && !isNaN(str - 0);
}

export function getLocalSrc(
	fontFamilyName: string,
	italic: string,
	weightName: string = ''
): string {
	return `local('${fontFamilyName} ${weightName} ${italic}')`
		.replace(/ +'/, "'")
		.replace(/ +/g, ' ');
}

export function setLocalRulesInArray(
	fontFamilyName: string,
	italic: string,
	weightName: string,
	local: Array<string>
): void {
	const localSrc = getLocalSrc(fontFamilyName, italic, weightName);

	local.push(localSrc);
	if (localSrc.includes(' ')) {
		local.push(localSrc.replace(/ +/g, '-'));
	}

	if (fontFamilyName.includes(' ')) {
		const localSrcFontFamilyNameCamelCase = getLocalSrc(
			fontFamilyName.replace(/ +/g, ''),
			italic,
			weightName
		);

		local.push(localSrcFontFamilyNameCamelCase);
		if (localSrcFontFamilyNameCamelCase.includes(' ')) {
			local.push(localSrcFontFamilyNameCamelCase.replace(/ +/g, '-'));
		}
	}

	if (weightName.includes(' ')) {
		const localSrcWeightNameCamelCase = getLocalSrc(
			fontFamilyName,
			italic,
			weightName.replace(/ +/g, '')
		);

		local.push(localSrcWeightNameCamelCase);
		if (localSrcWeightNameCamelCase.includes(' ')) {
			local.push(localSrcWeightNameCamelCase.replace(/ +/g, '-'));
		}
	}

	if (fontFamilyName.includes(' ') && weightName.includes(' ')) {
		const localSrcFullCamelCase = getLocalSrc(
			fontFamilyName.replace(/ +/g, ''),
			italic,
			weightName.replace(/ +/g, '')
		);

		local.push(localSrcFullCamelCase);
		if (localSrcFullCamelCase.includes(' ')) {
			local.push(localSrcFullCamelCase.replace(/ +/g, '-'));
		}
	}

	if (italic) {
		const localSrcWeightNameAndVariation = getLocalSrc(
			fontFamilyName,
			weightName.replace(/ +/g, '') + italic
		);

		local.push(localSrcWeightNameAndVariation);
		if (localSrcWeightNameAndVariation.includes(' ')) {
			local.push(localSrcWeightNameAndVariation.replace(/ +/g, '-'));
		}

		if (fontFamilyName.includes(' ')) {
			const localSrcFontFamilyNameCamelCaseAndWeightNameAndVariation =
				getLocalSrc(
					fontFamilyName.replace(/ +/g, ''),
					weightName.replace(/ +/g, '') + italic
				);

			local.push(
				localSrcFontFamilyNameCamelCaseAndWeightNameAndVariation
			);
			if (
				localSrcFontFamilyNameCamelCaseAndWeightNameAndVariation.includes(
					' '
				)
			) {
				local.push(
					localSrcFontFamilyNameCamelCaseAndWeightNameAndVariation.replace(
						/ +/g,
						'-'
					)
				);
			}
		}
	}
}

export function getWeightNameFromFontFamilyName(
	fontFamilyName: string,
	weight: number
): string {
	for (const weightName of WEIGHTS[weight]) {
		const regex = new RegExp(weightName, 'i');
		if (weightName && regex.test(fontFamilyName)) {
			return weightName;
		}

		const weightNameCamelCase = weightName.replace(/ +/g, '-');
		const regexCamelCase = new RegExp(weightNameCamelCase, 'i');
		if (regexCamelCase.test(fontFamilyName)) {
			return weightNameCamelCase;
		}
	}

	return '';
}

export function setLocalRulesInFontMatch(
	fontMatch: string,
	fontFamilyName: string,
	fontFullName: string
): string {
	if (!/local\(/.test(fontMatch)) {
		const weightMatches = /font-weight: (\d+);/.exec(fontMatch);
		const weight = parseInt((weightMatches && weightMatches[1]) || '0', 10);

		if (WEIGHTS[weight]) {
			const italic = /font-style:\s*italic;/.test(fontMatch)
				? 'Italic'
				: '';

			const local = [];
			const foundWeightName = getWeightNameFromFontFamilyName(
				fontFamilyName,
				weight
			);

			if (foundWeightName) {
				const fontFamilyNameWithoutWeightName = fontFamilyName
					.replace(foundWeightName, '')
					.replace(/^\s+|\s+$/g, '');
				setLocalRulesInArray(
					fontFamilyNameWithoutWeightName,
					italic,
					foundWeightName,
					local
				);
			} else {
				for (const weightName of WEIGHTS[weight]) {
					setLocalRulesInArray(
						fontFamilyName,
						italic,
						weightName,
						local
					);
				}
			}

			fontMatch = fontMatch.replace(
				/src:\s+url/g,
				`src: ${local.join(', ')}, url`
			);
		} else {
			fontMatch = fontMatch.replace(
				/src:\s+url/g,
				`src: local('${fontFullName}'), url`
			);
		}
	}

	return fontMatch;
}
