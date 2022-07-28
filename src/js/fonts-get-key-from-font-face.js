export default function fontsGetKeyFromFontFace(fontFace) {
	return (
		fontFace.family.toLowerCase().replaceAll(' ', '-') +
		'-' +
		fontFace.weight +
		'-' +
		fontFace.style
	);
}
