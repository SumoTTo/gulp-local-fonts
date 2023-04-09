import { join, dirname } from 'path';
import gulp from 'gulp';
import { existsSync, readFileSync, rmSync } from 'fs';
import localFonts from '../dist/index.mjs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, '/dist');
const files = {
	all: [
		'Alef-Bold.woff2',
		'Alef-Regular.woff2',
		'fonts.css',
		'fonts.js',
		'fonts-classes.js',
		'fonts-get-format-from-font-data.js',
		'fonts-get-key-from-font-face.js',
		'fonts-get-src-from-font-data.js',
		'fonts-load.js',
		'fonts-preloader-main.js',
		'fonts-preloader-worker.js',
		'star.eot',
		'star.svg',
		'star.ttf',
		'star.woff',
		'WooCommerce.eot',
		'WooCommerce.svg',
		'WooCommerce.ttf',
		'WooCommerce.woff',
	],
	google: [
		'fonts.css',
		'fonts.js',
		'fonts-classes.js',
		'fonts-get-format-from-font-data.js',
		'fonts-get-key-from-font-face.js',
		'fonts-get-src-from-font-data.js',
		'fonts-load.js',
		'fonts-preloader-main.js',
		'fonts-preloader-worker.js',
		'Lato-Black.woff2',
		'Lato-BlackItalic.woff2',
		'Lato-Bold.woff2',
		'Lato-BoldItalic.woff2',
		'Lato-Hairline.woff2',
		'Lato-HairlineItalic.woff2',
		'Lato-Italic.woff2',
		'Lato-Light.woff2',
		'Lato-LightItalic.woff2',
		'Lato-Regular.woff2',
		'OpenSans-Regular.woff2',
		'Roboto-Regular.woff2',
	],
	local: [
		'fonts.css',
		'fonts.js',
		'fonts-classes.js',
		'fonts-get-format-from-font-data.js',
		'fonts-get-key-from-font-face.js',
		'fonts-get-src-from-font-data.js',
		'fonts-load.js',
		'fonts-preloader-main.js',
		'fonts-preloader-worker.js',
		'star.eot',
		'star.svg',
		'star.ttf',
		'star.woff',
		'WooCommerce.eot',
		'WooCommerce.svg',
		'WooCommerce.ttf',
		'WooCommerce.woff',
	],
};

function getFixtures(glob) {
	return join(__dirname, 'fixtures', glob);
}

function clearDist() {
	if (existsSync(distPath)) {
		rmSync(distPath, { recursive: true });
	}
}

describe('gulp-local-fonts', function () {
	describe('global', function () {
		it('should emit error on streamed file', function () {
			return new Promise((done) => {
				return gulp
					.src(getFixtures('fonts-all.json'), { buffer: false })
					.pipe(localFonts({ cache: false }))
					.on('error', function (error) {
						expect(error.message).toBe('Streams not supported!');
						done();
					});
			});
		});
		it('should emit error if local font file not found', function () {
			return new Promise((done) => {
				return gulp
					.src(getFixtures('fonts-local-error.json'))
					.pipe(localFonts({ cache: false }))
					.on('error', function (error) {
						expect(error.message).toBe('Local font css not found!');
						done();
					});
			});
		});
		it('should emit error if google font not found', function () {
			return new Promise((done) => {
				return gulp
					.src(getFixtures('fonts-google-error.json'))
					.pipe(localFonts({ cache: false }))
					.on('error', function (error) {
						expect(error.message).toMatch(
							/^Unexpected response "[^"]+" for /
						);
						done();
					});
			});
		});
		it('should emit warning if google option is not an array', function () {
			return new Promise((done) => {
				return gulp
					.src(getFixtures('fonts-error-google-property.json'))
					.pipe(localFonts({ cache: false }))
					.on('warning', function (warning) {
						expect(warning.message).toBe(
							'Google option must be an array.'
						);
						done();
					});
			});
		});
		it('should emit warning if local option is not an array', function () {
			return new Promise((done) => {
				return gulp
					.src(getFixtures('fonts-error-local-property.json'))
					.pipe(localFonts({ cache: false }))
					.on('warning', function (warning) {
						expect(warning.message).toBe(
							'Local option must be an array.'
						);
						done();
					});
			});
		});
		it('should process empty json without error and does not create a directory', function () {
			return new Promise((done) => {
				const distPathTest = join(distPath, 'empty');

				return gulp
					.src(getFixtures('fonts-empty.json'))
					.pipe(localFonts({ cache: false }))
					.pipe(gulp.dest(distPathTest))
					.on('end', function () {
						expect(existsSync(distPathTest)).toBeFalsy();
						clearDist();
						done();
					});
			});
		});
		it('should process empty json property without error and does not create a directory', function () {
			return new Promise((done) => {
				const distPathTest = join(distPath, 'empty');

				return gulp
					.src(getFixtures('fonts-empty-2.json'))
					.pipe(localFonts({ cache: false }))
					.pipe(gulp.dest(distPathTest))
					.on('end', function () {
						expect(existsSync(distPathTest)).toBeFalsy();
						clearDist();
						done();
					});
			});
		});
	});

	describe('all', function () {
		it('should create files from Google and from local CSS, while combining them into one CSS', function () {
			return new Promise((done) => {
				const distPathTest = join(distPath, 'all');

				return gulp
					.src([
						getFixtures('fonts-all.json'),
						getFixtures('test.html'),
					])
					.pipe(localFonts({ cache: false }))
					.pipe(gulp.dest(distPathTest))
					.on('end', function () {
						files.local.forEach(function (name) {
							const file = join(distPathTest, name);
							expect(existsSync(file)).toBeTruthy();
							expect(
								readFileSync(file).toString()
							).toMatchSnapshot();
						});

						clearDist();
						done();
					});
			});
		});
	});

	describe('local', function () {
		it('Should create files from local css', function () {
			return new Promise((done) => {
				const distPathTest = join(distPath, 'local');

				return gulp
					.src(getFixtures('fonts-local.json'))
					.pipe(localFonts({ cache: false }))
					.pipe(gulp.dest(distPathTest))
					.on('end', function () {
						files.local.forEach(function (name) {
							const file = join(distPathTest, name);
							expect(existsSync(file)).toBeTruthy();
							expect(
								readFileSync(file).toString()
							).toMatchSnapshot();
						});

						clearDist();
						done();
					});
			});
		});
		it('should throw error that style file not found', function () {
			return new Promise((done) => {
				return gulp
					.src(getFixtures('fonts-local-error.json'))
					.pipe(localFonts({ cache: false }))
					.on('error', function (error) {
						expect(error.message).toBe('Local font css not found!');
						done();
					});
			});
		});
	});

	describe('google', function () {
		it('should create files from Google Fonts css', function () {
			return new Promise((done) => {
				const distPathTest = join(distPath, 'google');

				return gulp
					.src(getFixtures('fonts-google.json'))
					.pipe(localFonts({ cache: false }))
					.pipe(gulp.dest(distPathTest))
					.on('end', function () {
						files.google.forEach(function (name) {
							const file = join(distPathTest, name);
							expect(existsSync(file)).toBeTruthy();
							expect(
								readFileSync(file).toString()
							).toMatchSnapshot();
						});

						clearDist();
						done();
					});
			});
		});
	});
});
