import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;

class MockRedisClient {
  private store = new Map<string, string>();
  private timers = new Map<string, NodeJS.Timeout>();

  async get(key: string) {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, options?: any) {
    this.store.set(key, value);
    if (options?.EX) {
      if (this.timers.has(key)) clearTimeout(this.timers.get(key)!);
      this.timers.set(key, setTimeout(() => {
        this.store.delete(key);
        this.timers.delete(key);
      }, options.EX * 1000));
    }
    return 'OK';
  }

  async del(key: string) {
    this.store.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
    return 1;
  }
}

let redisClient: any = null;

export async function getRedisClient() {
  if (redisClient) return redisClient;

  if (REDIS_URL) {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err: any) => console.error('Redis Client Error', err));
    await redisClient.connect();
    console.log("Connected to Redis successfully");
  } else {
    console.warn("⚠️ REDIS_URL not defined. Using local MockRedisClient (In-Memory).");
    redisClient = new MockRedisClient();
  }

  return redisClient;
}
