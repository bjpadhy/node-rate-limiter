// Express imports
const express = require("express");
const app = express();
const requestIP = require("request-ip");

// Custom functions
const allowIncomingRequest = require("./validateRequest");
const processRequest = require("./processRequest");

// Request logging
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

// Redis config
const PORT = process.env.PORT || 8080;
const { createClient } = require("redis");
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";

require("dotenv").config();

// Start server
app.listen(PORT, async () => {
	// Connect Redis
	global.redisClient = createClient(REDIS_PORT, REDIS_HOST);
	await redisClient.connect();

	// Log success
	console.log(
		`Server listening on ${PORT}, Redis listening on ${REDIS_PORT}`
	);
});

// Morgan logging init
global.logger = morgan("combined", {
	stream: fs.createWriteStream(path.join(__dirname, "droppedRequests.log"), {
		flags: "a",
	}),
});

// Pretty print JSON response
app.set("json spaces", 4);

// Home route
app.get("/", (req, res) => {
	res.status(200).send("Hello!");
});

// Catch all auth requests
app.all("/recipes/*", async (req, res) => {
	// Attach client IP to request
	req["clientIP"] = requestIP.getClientIp(req);

	// Check rate limit quota
	const { isAllowed, rateLimitHeaders } = await allowIncomingRequest(req);

	// Process request
	if (isAllowed) return await processRequest(req, res, "RECIPES");

	// Log request and drop if quota exceeded
	logger(req, res, () => {
		res.writeHead(429, rateLimitHeaders).end(`Too many requests!`);
	});
});

// Wildcard catch all
app.use("*", (req, res) => {
	res.status(404);
	res.json({
		errorCode: 404,
		errorMessage: "Unable to find requested resource.",
	});
});
