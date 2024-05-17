const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class UsersController {
  static async getMe(request, response) {
    try {
      const token = request.headers['x-token'];
      if (!token) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const user = await dbClient.getUser({ _id: new dbClient.ObjectID(userId) });
      if (!user) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      return response.status(200).json({ id: user._id, email: user.email });
    } catch (err) {
      console.error(err);
      return response.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = UsersController;
