import fontsData from './fonts.js';
import fontsGetKeyFromFontFace from './fonts-get-key-from-font-face.js';

const intervalIds = [];

function addClasses( fontFaces, status ) {
	fontFaces.forEach( ( fontFace ) => {
		const fontKey = fontsGetKeyFromFontFace( fontFace );
		if ( fontsData[ fontKey ] ) {
			document.documentElement.classList.add(
				'font-' + fontKey + '-' + status
			);
		}
	} );
}

for ( const fontFaceKey in fontsData ) {
	const fontInfo = [];
	const fontData = fontsData[ fontFaceKey ];

	fontInfo.push( fontData[ 2 ].style );
	fontInfo.push( fontData[ 2 ].weight );
	fontInfo.push( '12px' );
	fontInfo.push( fontData[ 0 ] );

	const font = fontInfo.filter( Boolean ).join( ' ' );

	const intervalId = setInterval( () => {
		if ( document.fonts.check( font ) ) {
			clearInterval( intervalId );
			const loadedFontFaces = [];
			document.fonts.forEach( ( fontFace ) => {
				if (
					fontData[ 0 ] === fontFace.family &&
					fontData[ 2 ].style === fontFace.style &&
					fontData[ 2 ].weight === fontFace.weight
				) {
					loadedFontFaces.push( fontFace );
				}
			} );

			addClasses( loadedFontFaces, 'done' );
		}
	}, 10 );

	intervalIds.push( intervalId );
}

document.fonts.ready.then( () => {
	intervalIds.forEach( ( intervalId ) => clearInterval( intervalId ) );

	const loadedFontFaces = [];
	const errorFontFaces = [];

	document.fonts.forEach( ( fontFace ) => {
		if ( 'loaded' === fontFace.status ) {
			loadedFontFaces.push( fontFace );
		} else if ( 'error' === fontFace.status ) {
			errorFontFaces.push( fontFace );
		}
	} );

	addClasses( loadedFontFaces, 'done' );
	addClasses( errorFontFaces, 'error' );

	document.fonts.addEventListener( 'loadingdone', ( event ) =>
		addClasses( event.fontfaces, 'done' )
	);
	document.fonts.addEventListener( 'loadingerror', ( event ) =>
		addClasses( event.fontfaces, 'error' )
	);
} );
