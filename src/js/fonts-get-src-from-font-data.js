export default function fontsGetSrcFromFontData(fontData) {
	return fontData[1].match(/(?<=url\()[^)]+(?=\))/)[0];
}
