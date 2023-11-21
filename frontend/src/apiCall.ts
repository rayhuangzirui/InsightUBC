const performApiCall = async (query: any, endpoint: string) => {
	const serverUrl = `http://localhost:4321/${endpoint}`; // Update with your server's URL and port

	try {
		const response = await fetch(serverUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(query)
		});

		if (!response.ok) {
			let message = "HTTP error! status: " + response.status;

			try {
				const responseJson = await response.json();
				message += "\n" + JSON.stringify(responseJson);
			} catch (error) {
				console.error("Error parsing response as JSON:", error);
			}
			throw new Error(message);
		}

		return await response.json();
	} catch (error) {
		console.error("Error fetching data:", error);
		throw error;
	}
};

export default performApiCall;
