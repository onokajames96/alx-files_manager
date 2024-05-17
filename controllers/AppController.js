// AppController.js
const RedisClient = require('../utils/redis');
const DBClient = require('../utils/db');

class AppController {
  static async getStatus(req, res) {
    const redisStatus = RedisClient.isAlive();
    const dbStatus = DBClient.isAlive();
    res.status(200).json({ redis: redisStatus, db: dbStatus });
  }

  static async getStats(req, res) {
    const usersCount = await DBClient.nbUsers();
    const filesCount = await DBClient.nbFiles();
    res.status(200).json({ users: usersCount, files: filesCount });
  }
}

module.exports = AppController;
