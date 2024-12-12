import dbClient from './utils/db';

const waitConnection = () => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const repeatFct = async () => {
      if (dbClient.isAlive()) {
        resolve();
      } else if (attempts >= 10) {
        reject(new Error('Unable to connect to MongoDB after 10 attempts'));
      } else {
        attempts += 1;
        setTimeout(repeatFct, 1000); // Retry after 1 second
      }
    };

    repeatFct();
  });
};

(async () => {
  console.log(dbClient.isAlive()); // Initial state

  try {
    await waitConnection(); // Wait for connection
    console.log(dbClient.isAlive()); // Should be true if connected
    console.log(await dbClient.nbUsers()); // Number of users
    console.log(await dbClient.nbFiles()); // Number of files
  } catch (error) {
    console.error('Error:', error.message); // Handle connection failure
  }
})();

