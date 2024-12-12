import sha1 from 'sha1';
import dbClient from '../utils/db.js';

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
}

export default UsersController;
