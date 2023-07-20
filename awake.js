const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const Poke = async () => {
    const timestamp = new Date().toISOString();
    let log = 'Data Read :D';
    const rand = Math.floor(Math.random() * (5)) + 1;
	try {
		const connection = await mysql.createConnection(process.env.DATABASE_URL);
		await connection.query(`SELECT * FROM Restaurant LIMIT ${rand}`)

		connection.end();
	} catch (err) {
        console.log(err);
		log = err;
	}

    log = log + timestamp + "rand =" + rand + "\n";
    fs.appendFile('AwakeLog.txt', log, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
};

Poke();