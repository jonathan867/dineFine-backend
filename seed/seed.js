const { createRestaurantTableSQL, createAwardTableSQL, dropRestaurantTableSQL, dropAwardTableSQL, dropPartitions } = require('./sql.js');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const csv = require('csv-parser');

dotenv.config();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadAndSaveData = async () => {
	const connection = await mysql.createConnection(process.env.DATABASE_URL);
	try {
		await connection.query(dropAwardTableSQL); //clear the existing records
		console.log('***dropped awards table***');
		await connection.query(dropRestaurantTableSQL);
		console.log('***dropped restaurants table***');
		await connection.query(createAwardTableSQL); // populate tables with data
		console.log('***created awards table***');
		await delay(500);
		await connection.query(createRestaurantTableSQL);
		console.log('***created restaurant table***');

		const restaurantsDataPromise = new Promise((resolve, reject) => {
			const restaurantsData = [];
			fs.createReadStream('seed/restaurants.csv')
				.pipe(csv({ raw: true }))
				.on('data', (row) => {
					row.Longitude = Number(row.Longitude); // restaurantData won't keep the "" around strings. 
					row.Latitude = Number(row.Latitude); // So it will treat everything as a string unless you cast
					restaurantsData.push(Object.values(row));
				})
				.on('end', () => {
					resolve(restaurantsData);
				})
				.on('error', (err) => {
					reject(err);
				});
		});

		const awardsDataPromise = new Promise((resolve, reject) => {
			const awardsData = [];
			fs.createReadStream('seed/awards.csv')
				.pipe(csv({ raw: true }))
				.on('data', (row) => {
					awardsData.push(Object.values(row));
				})
				.on('end', () => {
					resolve(awardsData);
				})
				.on('error', (err) => {
					reject(err);
				});
		});

		const [restaurantsData, awardsData] = await Promise.all([restaurantsDataPromise, awardsDataPromise]);
		await connection.query('INSERT INTO Restaurant (Name, Address, Location, Price, Cuisine, Longitude, Latitude, PhoneNumber, Url, WebsiteUrl, Award, FacilitiesAndServices) VALUES ?', [restaurantsData]);
		console.log('***restaurant data loaded***');

		await connection.query('INSERT INTO Award (Distinction, Description) VALUES ?', [awardsData]);
		console.log('***award data loaded***');

		await connection.query('CREATE INDEX idx_longitude ON Restaurant (Longitude)');
		await connection.query('CREATE TABLE NewRestaurant AS SELECT * FROM Restaurant ORDER BY Longitude'); // sort by longitude
		await connection.query('ALTER TABLE NewRestaurant ADD COLUMN Coordinates POINT'); // add point
		await connection.query('UPDATE NewRestaurant SET Coordinates = ST_GeomFromText(CONCAT(\'POINT(\', Longitude, \' \', Latitude, \')\'))');
		await connection.query('CREATE INDEX idx_longitude ON NewRestaurant (Longitude)');
		await connection.query('DROP TABLE Restaurant'); // replace with sorted table
		await connection.query('ALTER TABLE NewRestaurant RENAME TO Restaurant');

		//partition the data
		await connection.query('DROP TABLE IF EXISTS Americas')
		await connection.query('DROP TABLE IF EXISTS Americas')
		await connection.query('DROP TABLE IF EXISTS Europe1')
		await connection.query('DROP TABLE IF EXISTS Europe2')
		await connection.query('DROP TABLE IF EXISTS Asia')
		await connection.query('DROP TABLE IF EXISTS Atlantic')
		await connection.query('DROP TABLE IF EXISTS MiddleEast')
		await connection.query('DROP TABLE IF EXISTS Pacific')
		console.log('***dropped partition tables***');

		await connection.query('CREATE TABLE Americas AS SELECT * FROM Restaurant LIMIT 686;');
		await connection.query('CREATE TABLE Europe1 AS SELECT * FROM Restaurant LIMIT 2083 OFFSET 676');
		await connection.query('CREATE TABLE Europe2 AS SELECT * FROM Restaurant LIMIT 2247 OFFSET 2659');
		await connection.query('CREATE TABLE Asia AS SELECT * FROM Restaurant LIMIT 1876 OFFSET 4906');
		await connection.query('CREATE TABLE Atlantic AS SELECT * FROM Restaurant LIMIT 215 OFFSET 606');
		await connection.query('CREATE TABLE MiddleEast AS SELECT * FROM Restaurant LIMIT 190 OFFSET 4826');
		await connection.query('CREATE TABLE Pacific AS SELECT * FROM Restaurant LIMIT 245');
		console.log('***created partitions***');

		connection.end();

	} catch (err) {
		console.error(err);
	}
};

loadAndSaveData()
	.then(() => {
		process.exit(0);
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});