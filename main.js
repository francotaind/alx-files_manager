import redisClient from './utils/redis';

(async () => {
  // Wait for Redis connection
  while (!redisClient.isAlive()) {
    console.log('Waiting for Redis client to connect...');
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for 100ms
  }

  console.log(redisClient.isAlive());
  console.log(await redisClient.get('myKey'));
  await redisClient.set('myKey', 12, 5);
  console.log(await redisClient.get('myKey'));

  setTimeout(async () => {
    console.log(await redisClient.get('myKey'));
  }, 1000 * 10);
})();

