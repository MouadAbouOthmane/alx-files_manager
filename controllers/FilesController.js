import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class FilesController {
    static async postUpload(req, res) {
        const { name, type, parentId = '0', isPublic = false, data } = req.body;
        const token = req.headers['x-token'];

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }

        if (!type || !['folder', 'file', 'image'].includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }

        if ((type !== 'folder' && !data) || (type === 'folder' && data)) {
            return res.status(400).json({ error: 'Missing data' });
        }

        const userId = await FilesController.getUserId(token);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (parentId !== '0') {
            const parentFile = await dbClient.db.collection('files').findOne({ _id: dbClient.ObjectId(parentId) });
            if (!parentFile) {
                return res.status(400).json({ error: 'Parent not found' });
            }
            if (parentFile.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
        }

        let localPath = '';
        if (type !== 'folder') {
            const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            const fileId = uuidv4();
            localPath = path.join(folderPath, fileId);
            fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
        }

        const newFile = {
            userId,
            name,
            type,
            parentId,
            isPublic,
            localPath: type !== 'folder' ? localPath : null,
        };

        const result = await dbClient.db.collection('files').insertOne(newFile);
        const fileId = result.insertedId;

        res.status(201).json({ id: fileId, ...newFile });
    }

    static async getUserId(token) {
        const key = `auth_${token}`;
        const userId = await redisClient.get(key);
        return userId;
    }
}

export default FilesController;
