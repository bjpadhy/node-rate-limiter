const axios = require("axios");

// Request processor
const processRequest = async (request, response, service) => {
	// Prepare service options
	const serviceOptions = prepareServiceOptions(request, service);

	// Forward request to service
	const responseFromService = await axios.request(serviceOptions);

	// Return response
	await response.status(200).json(responseFromService.data);
};

// Define microservice endpoint URLs
const SERVICE_URLS = {
	RECIPES: `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com`,
};

// Prepare options for axios to forward request to service
const prepareServiceOptions = (request, service) => {
	const { url, method, query: params } = request;
	switch (service) {
		case "RECIPES":
			return {
				url: SERVICE_URLS[service] + url,
				method,
				params,
				headers: {
					"X-RapidAPI-Host": process.env.NUTRITION_API_HOST,
					"X-RapidAPI-Key": process.env.NUTRITION_API_KEY,
				},
			};
		default:
			return { url, method, params };
	}
};

module.exports = processRequest;
