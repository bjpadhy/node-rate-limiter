const REFILL_RATE_IN_SEC = 60;
const BUCKET_SIZE = 5;

const refillBucket = async (bucket) => {
	await redisClient.set(bucket, BUCKET_SIZE, {
		EX: REFILL_RATE_IN_SEC,
	});

	return { tokens: BUCKET_SIZE, TTL: REFILL_RATE_IN_SEC };
};

const allowIncomingRequest = async (request) => {
	const { clientIP: bucket } = request;
	let tokens = await redisClient.get(bucket);
	let TTL = await redisClient.ttl(bucket);
	let isAllowed = false;

	// If bucket was not found, create it
	if (!tokens && tokens !== 0) {
		({ tokens, TTL } = await refillBucket(bucket));
		isAllowed = true;
	}

	// If bucket is not empty, remove a token
	if (tokens > 0) {
		await redisClient.decr(bucket);
		tokens = tokens - 1;
		isAllowed = true;
	}

	// Return status and rate limiter headers
	return {
		isAllowed,
		rateLimitHeaders: {
			"X-RateLimit-Limit": BUCKET_SIZE,
			"X-RateLimit-Remaining": tokens,
			"X-RateLimit-Retry-After": TTL,
		},
	};
};

module.exports = allowIncomingRequest;
