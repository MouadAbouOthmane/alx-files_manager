const { v4: uuidv4 } = require('uuid');

// Assuming you have some functions to interact with your database
const { getUserByToken, createFile } = require('../services/FileService');

// POST /files
async function postUpload(req, res) {
    try {
        // Retrieve user based on the token
        const user = await getUserByToken(req.headers['x-token']);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Validate request body
        const { name, type, data, parentId, isPublic } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }
        if (!type || !['folder', 'file', 'image'].includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }
        if (['file', 'image'].includes(type) && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        // Handle parentId
        if (parentId) {
            const parentFile = await getFileById(parentId);
            if (!parentFile) {
                return res.status(400).json({ error: 'Parent not found' });
            }
            if (parentFile.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
        }

        // Store Files
        let localPath = '';
        if (['file', 'image'].includes(type)) {
            // Store file locally
            const fileName = uuidv4();
            localPath = `${process.env.FOLDER_PATH || '/tmp/files_manager'}/${fileName}`;
            // Assuming data is Base64 encoded, decode it and write to file
            const buffer = Buffer.from(data, 'base64');
            require('fs').writeFileSync(localPath, buffer);
        }

        // Add File to Database
        const file = await createFile({
            userId: user._id,
            name,
            type,
            parentId: parentId || '0',
            isPublic: isPublic || false,
            localPath
        });

        return res.status(201).json(file);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    postUpload
};

