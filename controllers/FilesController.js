import Queue from 'bull';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { mkdir, writeFile, readFileSync } from 'fs';
import mime from 'mime-types';
import dbClient from '../utils/db';
import { getIdAndKey, isValidUser } from '../utils/users';

class FilesController {
  static async postUpload(request, response) {
    const fileQ = new Queue('fileQ');
    const dir = process.env.FOLDER_PATH || '/tmp/files_manager';

    const { userId } = await getIdAndKey(request);
    if (!isValidUser(userId)) return response.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const fileName = request.body.name;
    if (!fileName) return response.status(400).json({ error: 'Missing name' });

    const fileType = request.body.type;
    if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return response.status(400).json({ error: 'Missing type' });

    const fileData = request.body.data;
    if (!fileData && fileType !== 'folder') return response.status(400).json({ error: 'Missing data' });

    const publicFile = request.body.isPublic || false;
    let parentId = request.body.parentId || 0;
    parentId = parentId === '0' ? 0 : parentId;
    if (parentId !== 0) {
      const parentFile = await dbClient.files.findOne({ _id: ObjectId(parentId) });
      if (!parentFile) return response.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return response.status(400).json({ error: 'Parent is not a folder' });
    }

    const fileInsertData = {
      userId: user._id,
      name: fileName,
      type: fileType,
      isPublic: publicFile,
      parentId
    };

    if (fileType === 'folder') {
      const result = await dbClient.files.insertOne(fileInsertData);
      return response.status(201).json({
        id: result.insertedId,
        userId: fileInsertData.userId,
        name: fileInsertData.name,
        type: fileInsertData.type,
        isPublic: fileInsertData.isPublic,
        parentId: fileInsertData.parentId
      });
    }

    const fileUid = uuidv4();
    const decData = Buffer.from(fileData, 'base64');
    const filePath = `${dir}/${fileUid}`;

    mkdir(dir, { recursive: true }, (error) => {
      if (error) return response.status(400).json({ error: error.message });
    });

    writeFile(filePath, decData, (error) => {
      if (error) return response.status(400).json({ error: error.message });
    });

    fileInsertData.localPath = filePath;
    const result = await dbClient.files.insertOne(fileInsertData);

    fileQ.add({
      userId: fileInsertData.userId,
      fileId: fileInsertData._id
    });

    return response.status(201).json({
      id: result.insertedId,
      userId: fileInsertData.userId,
      name: fileInsertData.name,
      type: fileInsertData.type,
      isPublic: fileInsertData.isPublic,
      parentId: fileInsertData.parentId
    });
  }

  static async getShow(request, response) {
    const { userId } = await getIdAndKey(request);
    if (!isValidUser(userId)) return response.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const fileId = request.params.id || '';
    const file = await dbClient.files.findOne({ _id: ObjectId(fileId), userId: user._id });
    if (!file) return response.status(404).json({ error: 'Not found' });

    return response.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId
    });
  }

  static async getIndex(request, response) {
    const { userId } = await getIdAndKey(request);
    if (!isValidUser(userId)) return response.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    let parentId = request.query.parentId || 0;
    parentId = parentId === '0' ? 0 : parentId;

    if (parentId !== 0) {
      const parentFile = await dbClient.files.findOne({ _id: ObjectId(parentId) });
      if (!parentFile || parentFile.type !== 'folder') return response.status(400).json({ error: 'Parent not found or not a folder' });
    }

    const page = parseInt(request.query.page, 10) || 0;
    const filesPerPage = 20;

    const query = parentId === 0 ? { userId } : { userId, parentId: ObjectId(parentId) };
    const files = await dbClient.files.find(query).skip(page * filesPerPage).limit(filesPerPage).toArray();

    return response.status(200).json(files.map(file => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId
    })));
  }

  static async putPublish(request, response) {
    const { userId } = await getIdAndKey(request);
    if (!isValidUser(userId)) return response.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const fileId = request.params.id || '';
    let file = await dbClient.files.findOne({ _id: ObjectId(fileId), userId: user._id });
    if (!file) return response.status(404).json({ error: 'Not found' });

    await dbClient.files.updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic: true } });
    file = await dbClient.files.findOne({ _id: ObjectId(fileId), userId: user._id });

    return response.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId
    });
  }

  static async putUnpublish(request, response) {
    const { userId } = await getIdAndKey(request);
    if (!isValidUser(userId)) return response.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const fileId = request.params.id || '';
    let file = await dbClient.files.findOne({ _id: ObjectId(fileId), userId: user._id });
    if (!file) return response.status(404).json({ error: 'Not found' });

    await dbClient.files.updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic: false } });
    file = await dbClient.files.findOne({ _id: ObjectId(fileId), userId: user._id });

    return response.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId
    });
  }

  static async getFile(request, response) {
    const fileId = request.params.id || '';
    const size = request.query.size || 0;

    const file = await dbClient.files.findOne({ _id: ObjectId(fileId) });
    if (!file) return response.status(404).json({ error: 'Not found' });

    const { isPublic, userId, type } = file;
    const { userId: user } = await getIdAndKey(request);

    if ((!isPublic && (!user || userId.toString() !== user)) || type === 'folder') return response.status(404).json({ error: 'Not found' });

    const path = size === '0' ? file.localPath : `${file.localPath}_${size}`;

    try {
      const fileData = readFileSync(path);
      const mimeType = mime.contentType(file.name);
      response.setHeader('Content-Type', mimeType);
      return response.status(200).send(fileData);
    } catch (err) {
      return response.status
  }
  }
}

export default FilesController;)
