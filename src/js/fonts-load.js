import fontsData from './fonts.js';

const __dirname = new URL( '.', import.meta.url ).pathname;

for ( const fontKey in fontsData ) {
	const fontData = fontsData[ fontKey ];
	const fontFace = new FontFace(
		fontData[ 0 ],
		fontData[ 1 ].replace( /url\((['"]?)/g, 'url($1' + __dirname ),
		fontData[ 2 ]
	);

	const event = new CustomEvent( 'before-adding-font-face', {
		detail: { fontFace, fontKey, fontsData },
	} );

	document.dispatchEvent( event );

	document.fonts.add( fontFace );
}
