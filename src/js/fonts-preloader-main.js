import fontsData from './fonts.js';
import fontsGetKeyFromFontFace from './fonts-get-key-from-font-face.js';
import fontsGetSrcFromFontData from './fonts-get-src-from-font-data.js';
import fontsGetFormatFromFontData from './fonts-get-format-from-font-data.js';

const __dirname = new URL('.', import.meta.url).pathname;
const fetchUrl = document.querySelector('[data-fonts-preloader-fetch-url]')
	?.dataset?.fontsPreloaderFetchUrl;

if (fetchUrl) {
	const worker = new Worker(__dirname + 'fonts-preloader-worker.js');
	document.fonts.ready.then(() => {
		const preloadData = [];
		const loadedFontFaces = [];

		document.fonts.forEach((fontFace) => {
			if ('loaded' === fontFace.status) {
				loadedFontFaces.push(fontFace);
			}
		});

		loadedFontFaces.forEach((fontFace) => {
			const fontKey = fontsGetKeyFromFontFace(fontFace);
			if (fontsData[fontKey]) {
				const fontData = fontsData[fontKey];
				preloadData.push({
					src: fontsGetSrcFromFontData(fontData),
					type: fontsGetFormatFromFontData(fontData),
				});
			}
		});

		worker.postMessage([{ fonts: preloadData }, fetchUrl]);
	});
}
