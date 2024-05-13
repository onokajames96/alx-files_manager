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
import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.myClient = createClient();
    this.myClient.on('error', (error) => console.log(error));
  }

  isAlive() {
    return this.myClient.connected;
  }

  async get(key) {
    const getAsync = promisify(this.Client.GET).bind(this.Client);
    return getAsync(key);
  }

  async set(key, val, time) {
    const setAsync = promisify(this.Client.SET).bind(this.Client);
    return setAsync(key, val, 'EX', time);
  }

  async del(key) {
    const delAsync = promisify(this.Client.DEL).bind(this.Client);
    return delAsync(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
