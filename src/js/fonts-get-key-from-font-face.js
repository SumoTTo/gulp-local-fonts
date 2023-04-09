export default function fontsGetKeyFromFontFace(fontFace) {
	return (
		fontFace.family.toLowerCase().replace(/ /g, '-') +
		'-' +
		fontFace.weight +
		'-' +
		fontFace.style
	);
}
