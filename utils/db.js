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
isAlive () {
	return.this.client.isconnected();
}

