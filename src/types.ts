import { type RequestInit } from 'node-fetch';

export declare type Options = {
	readonly cache?: boolean;
	readonly google?: GoogleOptions;
	readonly cssTransform?: CssTransformFunction;
	readonly nodeFetchOptions?: RequestInit;
	readonly createdJsFiles?: boolean;
	readonly jsTransform?: JsTransformFunction;
};

export declare type GoogleOptions = {
	readonly url?: string;
	readonly display?: string | false;
	readonly text?: string | false;
	readonly subset?: string | false;
	readonly effect?: string | false;
};

export declare type cssTransformFunctionParams = {
	css: string;
};

export declare type CssTransformFunction = (
	params: cssTransformFunctionParams
) => Promise<string> | string;

export declare type JsTransformFunctionParams = {
	js: string;
	fileName: string;
	css: string;
};

export declare type JsTransformFunction = (
	params: JsTransformFunctionParams
) => Promise<string> | string;

export declare type FontsJson = {
	readonly google?: Array<string>;
	readonly local?: Array<string>;
};

export declare type FontNames = {
	[key: string]: string;
};

export declare type FontPaths = {
	[key: string]: string;
};
