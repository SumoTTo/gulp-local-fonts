import fs from 'fs';
import path from 'path';
import nodeFetch, { Request, Response } from 'node-fetch';
import { getFetchInit } from './utils';

export function fetch( url: string ): Promise<Response> {
	const options = getFetchInit();
	const request = new Request( url, options );
	if ( request.url.substring( 0, 5 ) === 'file:' ) {
		return new Promise( ( resolve, reject ) => {
			const filePath = path.normalize( url.substring( 'file:///'.length ) );
			if ( ! fs.existsSync( filePath ) ) {
				reject( `File not found: ${ filePath }` );
			}

			const readStream = fs.createReadStream( filePath );
			readStream.on( 'open', function() {
				resolve(
					new Response( readStream, {
						status: 200,
						statusText: 'OK',
						headers: {
							'Content-Length': fs
								.statSync( filePath )
								.size.toString(),
						},
					} )
				);
			} );
		} );
	}

	return nodeFetch( url, options );
}
