import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import redisClient from '../utils/redis.js';
import dbClient, { ObjectId } from '../utils/db.js';

export async function postUpload(req, res) {
  try {
    console.log('Starting file upload process');

    const token = req.headers['x-token'];
    console.log('Token received:', token);

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      console.log('Unauthorized access attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log('User authenticated with userId:', userId);

    const { name, type, parentId = '0', isPublic = false, data } = req.body;
    console.log('Request body:', { name, type, parentId, isPublic, data });

    // Validate request payload
    if (!name) {
      console.log('Missing name in the request body');
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!['folder', 'file', 'image'].includes(type)) {
      console.log('Invalid type in the request body:', type);
      return res.status(400).json({ error: 'Invalid type' });
    }
    if (type !== 'folder' && !data) {
      console.log('Missing data for type:', type);
      return res.status(400).json({ error: 'Missing data' });
    }

    // Validate parentId
    if (parentId !== '0') {
      if (!ObjectId.isValid(parentId)) {
        console.log('Invalid parentId format:', parentId);
        return res.status(400).json({ error: 'Invalid parentId format' });
      }
      console.log('Valid parentId format:', parentId);

      const parentFile = await dbClient.getDB().collection('files').findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        console.log('Parent file not found for parentId:', parentId);
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        console.log('Parent is not a folder, type:', parentFile.type);
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
      console.log('Parent file is a folder:', parentFile);
    }

    const user = ObjectId(userId);
    const newFile = {
      userId: user,
      name,
      type,
      parentId: parentId === '0' ? '0' : ObjectId(parentId),
      isPublic,
      createdAt: new Date(),
    };
    console.log('New file object created:', newFile);

    // Handle file or image
    if (type === 'file' || type === 'image') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        console.log('Folder path does not exist. Creating folder:', folderPath);
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(folderPath, uuidv4());
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      newFile.localPath = filePath;
      console.log('File saved at:', filePath);
    }

    // Save file in DB
    const result = await dbClient.getDB().collection('files').insertOne(newFile);
    newFile._id = result.insertedId;
    console.log('File saved in database with _id:', newFile._id);

    // Return response
    console.log('Returning response for file upload with ID:', newFile._id);
    return res.status(201).json({
      id: newFile._id,
      userId,
      name,
      type,
      isPublic,
      parentId: newFile.parentId,
    });
  } catch (error) {
    console.error('Error in postUpload:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
export async function getShow(req, res) {
  try {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.getDB().collection('files').findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  } catch (error) {
    console.error('Error in getShow:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getIndex(req, res) {
  try {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = '0', page = 0 } = req.query;
    const skip = parseInt(page) * 20;
    const limit = 20;

    const files = await dbClient.getDB().collection('files').aggregate([
      {
        $match: {
          userId: ObjectId(userId),
          parentId: parentId === '0' ? '0' : ObjectId(parentId),
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]).toArray();

    return res.status(200).json(files.map(file => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    })));
  } catch (error) {
    console.error('Error in getIndex:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
