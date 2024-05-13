import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
	constructor() {
		this.client = redis.createClient();

		this.cleint.on ('error', (err) => {
			console.error(`Redis client error: ${err}`);
	});
}
isAlive() {
	this.client.connected;
}
