import { FontsJson, Options } from './types';
import Vinyl from 'vinyl';
import hash from 'object-hash';
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'fs';
import { resolve } from 'path';
import { CACHE_DIR } from './constants';
import init from './init';

function hasCache(cacheKey: string): boolean {
	return existsSync(resolve(CACHE_DIR, cacheKey));
}

function getCache(cacheKey: string): Vinyl.BufferFile[] {
	const cacheVinylFiles = [];
	if (hasCache(cacheKey)) {
		const cacheDir = resolve(CACHE_DIR, cacheKey);
		const cacheFiles = readdirSync(cacheDir);
		cacheFiles.forEach((cacheFile) => {
			cacheVinylFiles.push(
				new Vinyl({
					path: cacheFile,
					contents: Buffer.from(
						readFileSync(resolve(cacheDir, cacheFile))
					),
				})
			);
		});
	}

	return cacheVinylFiles;
}

function setCache(cacheKey: string, vinylFile: Vinyl.BufferFile): void {
	const cacheDir = resolve(CACHE_DIR, cacheKey);
	if (!existsSync(cacheDir)) {
		mkdirSync(cacheDir, { recursive: true });
	}

	writeFileSync(
		resolve(cacheDir, vinylFile.basename),
		vinylFile.contents.toString()
	);
}

function delCache(): void {
	if (existsSync(CACHE_DIR)) {
		rmSync(CACHE_DIR, { recursive: true, force: true });
	}
}

export default async function cache(
	json: FontsJson,
	options: Options,
	basePath: string
): Promise<Vinyl.BufferFile[]> {
	const cacheKey = hash(json);
	if (hasCache(cacheKey)) {
		return getCache(cacheKey);
	}
	delCache();
	const vinylFiles = await init(json, options, basePath);

	vinylFiles.forEach((vinylFile) => setCache(cacheKey, vinylFile));

	return vinylFiles;
}
