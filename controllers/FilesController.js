import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class FilesController {
    static async putPublish(req, res) {
        const { id } = req.params;
        const token = req.headers['x-token'];

        const userId = await FilesController.getUserId(token);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const file = await dbClient.db.collection('files').findOne({ _id: dbClient.ObjectId(id), userId });
        if (!file) {
            return res.status(404).json({ error: 'Not found' });
        }

        await dbClient.db.collection('files').updateOne({ _id: dbClient.ObjectId(id) }, { $set: { isPublic: true } });
        return res.status(200).json({ ...file, isPublic: true });
    }

    static async putUnpublish(req, res) {
        const { id } = req.params;
        const token = req.headers['x-token'];

        const userId = await FilesController.getUserId(token);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const file = await dbClient.db.collection('files').findOne({ _id: dbClient.ObjectId(id), userId });
        if (!file) {
            return res.status(404).json({ error: 'Not found' });
        }

        await dbClient.db.collection('files').updateOne({ _id: dbClient.ObjectId(id) }, { $set: { isPublic: false } });
        return res.status(200).json({ ...file, isPublic: false });
    }

    static async getUserId(token) {
        const key = `auth_${token}`;
        const userId = await redisClient.get(key);
        return userId;
    }
}

export default FilesController;
