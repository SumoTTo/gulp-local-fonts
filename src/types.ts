import { type RequestInit } from 'node-fetch';

export declare type Options = {
	readonly cache?: boolean;
	readonly google?: GoogleOptions;
	readonly cssTransform?: CssTransformFunction;
	readonly nodeFetchOptions?: RequestInit;
};

export declare type GoogleOptions = {
	readonly url?: string;
	readonly display?: string | false;
	readonly text?: string | false;
	readonly subset?: string | false;
	readonly effect?: string | false;
};

export declare type CssTransformFunction = (css: string) => string;

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
