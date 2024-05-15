import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class FilesController {
    static async getShow(req, res) {
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

        return res.status(200).json(file);
    }

    static async getIndex(req, res) {
        const token = req.headers['x-token'];
        const { parentId = '0', page = '0' } = req.query;

        const userId = await FilesController.getUserId(token);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const perPage = 20;
        const skip = parseInt(page) * perPage;

        const files = await dbClient.db.collection('files').find({ userId, parentId }).skip(skip).limit(perPage).toArray();
        return res.status(200).json(files);
    }

    static async getUserId(token) {
        const key = `auth_${token}`;
        const userId = await redisClient.get(key);
        return userId;
    }
}

export default FilesController;
