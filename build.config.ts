/* eslint-disable import/no-unresolved */
// noinspection JSUnusedGlobalSymbols

import { defineBuildConfig } from 'unbuild';
import { copySync } from 'fs-extra';

export default defineBuildConfig({
	declaration: true,
	hooks: {
		'build:done'() {
			copySync('src/js', 'dist/js');
		},
	},
});
