export default function fontsGetFormatFromFontData( fontData ) {
	return fontData[ 1 ].match( /(?<=format\(['"])[^'"]+(?=['"]\))/ )[ 0 ];
}
