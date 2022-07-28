import fontsData from './fonts.js';

const __dirname = new URL('.', import.meta.url).pathname;

for (const fontKey in fontsData) {
	const fontData = fontsData[fontKey];
	document.fonts.add(
		new FontFace(
			fontData[0],
			fontData[1].replaceAll('url(', 'url(' + __dirname),
			fontData[2]
		)
	);
}
