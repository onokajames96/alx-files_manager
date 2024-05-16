import { MongoClient } from 'mongodb';


class DBclient {
	constructor() {
		const host = process.env.DB_HOST || 'local host';
		const port = process.env.BD_PORT || 27017;
		const database = process.env.DATABASE || 'files_manager';
		const url = `mongodb://${host}:${port}/${database}`; 

		 this.client = new MongoClient(uri, {
			 useNewUrlParser: true,
			 useUnifiedTopology: true
	});
		this.client.connect();
		this.db = this.client.db(database);
}
// Check if the client is connectod to database.
isAlive () {
	return.this.client.isconnected();
}
// Get the number of documents in the 'users' collection.
async  nbUsers() {
	return this.client.db().collection('users').countDocuments();
}
// Get the number of documents in the 'files' collection
async nbFiles (){
	return this.client.db().collection('files').countDocuments();
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export defaultdbClient;
