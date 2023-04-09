import fontsData from './fonts.js';
import fontsGetKeyFromFontFace from './fonts-get-key-from-font-face.js';

function addClasses(fontFaces, status) {
	fontFaces.forEach((fontFace) => {
		const fontKey = fontsGetKeyFromFontFace(fontFace);
		if (fontsData[fontKey]) {
			document.documentElement.classList.add(
				'font-' + fontKey + '-' + status
			);
		}
	});
}

document.fonts.ready.then(() => {
	const loadedFontFaces = [];
	const errorFontFaces = [];

	document.fonts.forEach((fontFace) => {
		if ('loaded' === fontFace.status) {
			loadedFontFaces.push(fontFace);
		} else if ('error' === fontFace.status) {
			errorFontFaces.push(fontFace);
		}
	});

	addClasses(loadedFontFaces, 'done');
	addClasses(errorFontFaces, 'error');

	document.fonts.addEventListener('loadingdone', (event) =>
		addClasses(event.fontfaces, 'done')
	);
	document.fonts.addEventListener('loadingerror', (event) =>
		addClasses(event.fontfaces, 'error')
	);
});
