import {
	CssTransformFunction,
	FontNames,
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
import { PLUGIN_NAME } from './constants';

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
	fontNames: FontNames
): string {
	const matches = css.matchAll(/@font-face\s+{[^}]+}/g);
	return Array.from(matches, (m) => m[0])
		.map((fontMatch) => {
			fontUrls.forEach(function (fontUrl) {
				const fontPath = fontPaths[fontUrl];
				const fontName = fontNames[fontUrl];
				const fontRegExp = new RegExp(escapeRegExp(fontUrl), 'g');

				if (fontRegExp.test(fontMatch)) {
					fontMatch = fontMatch.replace(fontRegExp, fontPath);
					if (!/local\(/.test(fontMatch)) {
						fontMatch = fontMatch.replace(
							/src:\s+url/g,
							`src: local('${fontName}'), url`
						);
					}
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
	fontFullName: string;
}> {
	let buffer: Buffer;
	let fontFileExt: string;
	let fontPostscriptName: string;
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
		fontPostscriptName =
			fontData.postscriptName || basename(uri, fontFileExt);
		fontFullName = fontData.fullName || basename(uri, fontFileExt);
	} catch (error) {
		fontFileExt = extname(uri);
		fontPostscriptName = basename(uri, fontFileExt);
		fontFullName = basename(uri, fontFileExt);
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
		fontFullName,
	};
}

export async function getFontFilesData(fontUris: Array<string>): Promise<{
	fontFiles: Vinyl.BufferFile[];
	fontNames: FontNames;
	fontPaths: FontPaths;
}> {
	const fontFiles = [];
	const fontNames = {};
	const fontPaths = {};

	await Promise.all(
		fontUris.filter(arrayUnique).map(async (fontUri) => {
			const { fontFile, fontFilePath, fontFullName } =
				await getFontFileData(fontUri);

			fontFiles.push(fontFile);
			fontPaths[fontUri] = fontFilePath;
			fontNames[fontUri] = fontFullName;
		})
	);

	return {
		fontFiles,
		fontNames,
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

export function toCamelCase(str) {
	return (
		str[0].toLowerCase() +
		str
			.slice(1)
			.toLowerCase()
			.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
	);
}

export function isNumber(str) {
	return !isNaN(parseFloat(str)) && !isNaN(str - 0);
}
