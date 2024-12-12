import sha1 from 'sha1';
import dbClient, { ObjectId } from '../utils/db.js';
import redisClient from '../utils/redis.js';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    // Validate input
    if (!email) {
      console.log('POST /users - 400 Missing email');
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      console.log('POST /users - 400 Missing password');
      return res.status(400).json({ error: 'Missing password' });
    }
    // Check if the email already exists in the database
    const existingUser = await dbClient.db.collection('users').findOne({ email });
    if (existingUser) {
      console.log(`POST /users - 400 Already exist: ${email}`);
      return res.status(400).json({ error: 'Already exist' });
    }
    // Hash the password
    const hashedPassword = sha1(password);
    // Insert new user into the database
    const newUser = { email, password: hashedPassword };
    const result = await dbClient.db.collection('users').insertOne(newUser);
    // Log the success and return the new user data
    console.log(`POST /users - 201 Created: ${email}`);
    return res.status(201).json({ id: result.insertedId, email });
  }
    static async getMe(req, res) {
  const token = req.header('X-Token');
  console.log(`GET /users/me - Received token: ${token}`);

  if (!token) {
    console.log('GET /users/me - 401 No token provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);
  console.log(`GET /users/me - Retrieved userId from Redis: ${userId}`);

  if (!userId) {
    console.log('GET /users/me - 401 No user found for the token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    console.log(`GET /users/me - User lookup attempted for ID: ${userId}`);

    if (!user) {
      console.log(`GET /users/me - 401 No user found with ID: ${userId}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`GET /users/me - 200 User found: ${user.email}`);
    return res.status(200).json({ id: user._id, email: user.email });
  } catch (error) {
    console.error(`GET /users/me - Error finding user: ${error.message}`);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
}

export default UsersController;
