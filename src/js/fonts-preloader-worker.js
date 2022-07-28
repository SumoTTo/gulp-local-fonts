addEventListener('message', async (event) => {
	const [preloadData, fetchUrl] = event.data;

	await fetch(fetchUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json;charset=utf-8',
		},
		body: JSON.stringify(preloadData),
	});
});
