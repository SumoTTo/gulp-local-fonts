import fontsData from './fonts.js';
import fontsGetKeyFromFontFace from './fonts-get-key-from-font-face.js';

function addClasses( fontFaces, status ) {
	if ( fontFaces.length ) {
		fontFaces.forEach( ( fontFace ) => {
			const fontKey = fontsGetKeyFromFontFace( fontFace );
			if ( fontsData[ fontKey ] ) {
				document.documentElement.classList.add(
					'font-' + fontKey + '-' + status
				);
			}
		} );
	}
}

document.addEventListener( 'before-adding-font-face', ( event ) => {
	const fontFace = event.detail.fontFace;
	if ( 'loaded' === fontFace.status ) {
		addClasses( [ fontFace ], 'done' );
	} else if ( 'error' === fontFace.status ) {
		addClasses( [ fontFace ], 'error' );
	} else {
		fontFace.loaded.then( () => {
			addClasses( [ fontFace ], 'done' );
		} ).catch( () => {
			addClasses( [ fontFace ], 'error' );
		} );
	}
} );

document.fonts.ready.then( () => {
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
