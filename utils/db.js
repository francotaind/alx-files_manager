import { MongoClient, ObjectId } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.dbName = database;
    this.db = null;

    // Connect to the database
    this.client.connect()
      .then(() => {
        this.db = this.client.db(this.dbName);
        console.log('MongoDB connected successfully');
      })
      .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
      });
  }

  // Check if the client is connected
  isAlive() {
    return this.client && this.client.topology && this.client.topology.isConnected();
  }

  // Get the database instance after connection is successful
  getDB() {
    if (!this.db) {
      throw new Error('MongoDB connection not established');
    }
    return this.db;
  }

  // Count users in the 'users' collection
  async nbUsers() {
    try {
      const usersCollection = this.getDB().collection('users');
      return await usersCollection.countDocuments();
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }

  // Count files in the 'files' collection
  async nbFiles() {
    try {
      const filesCollection = this.getDB().collection('files');
      return await filesCollection.countDocuments();
    } catch (error) {
      console.error('Error counting files:', error);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export { dbClient as default, ObjectId };
