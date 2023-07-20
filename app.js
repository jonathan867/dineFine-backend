require('dotenv').config()
const express = require('express')
const cors = require('cors');
const mysql = require('mysql2/promise');
const axios = require('axios');
const fs = require('fs');

const app = express()
const port = 3001

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // cross-origin resource sharing

// //routes
app.get('/find-closest/:lat/:long', async (req, res) => {
    try {
        const { lat, long } = req.params;
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        partition = "";
        if (long > 97 || long < -168) {
            partition = 'Asia'
        } else if (long < -149) {
            partition = 'Pacific'
        } else if (long < -48) {
            partition = 'Americas'
        } else if (long < -23) {
            partition = 'Atlantic'
        } else if (long < 5) {
            partition = 'Europe1'
        } else if (long < 30) {
            partition = 'Europe2'
        } else if (long < 98) {
            partition = 'MiddleEast'
        }
        const query = `
            SELECT r.id, r.Name, r.Address, r.Location, r.Price, r.Cuisine, r.Longitude, r.Latitude,
                r.PhoneNumber, r.Url, r.WebsiteUrl, r.Award, r.FacilitiesAndServices, a.Description AS AwardDescription
            FROM ${partition} r
            JOIN Award a ON r.Award = a.Distinction
            ORDER BY ST_Distance(r.coordinates, ST_GeomFromText('POINT(${long} ${lat})'))
            LIMIT 1
        `;
        // 1. SELECT: defines the info to retrieve. It reqires all the fields in r (Restaurant) and a new field called AwardDescription from the Description col of a (Award)
        // 2. FROM: defines r as the Restaurant partition
        // 3. JOIN: combines rows. It defines a as the table Award, and ON combines Distinctions from a to matching Awards on r
        // 4. ORDER: sorts by distance to point

        const [result] = await connection.query(query);
        connection.end();

        res.send(result);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Error');
    }
});

app.get('/get-image-url/:name/:address', async (req, res) => {
    try {
        const { name, address } = req.params;
        const encodedNameAddress = encodeURIComponent(name + " " + address);
        const photoreferenceResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodedNameAddress}&inputtype=textquery&fields=name,formatted_address,photos&key=${process.env.MAP_API_KEY}`);
        const photoreferenceData = photoreferenceResponse.data;
        if (photoreferenceData.candidates && photoreferenceData.candidates.length > 0) {
            const candidate = photoreferenceData.candidates[0];
            if (candidate.photos && candidate.photos.length > 0) {
                const htmlAttributions = photoreferenceData.candidates[0].photos[0].html_attributions;
                const photoReference = photoreferenceData.candidates[0].photos[0].photo_reference;

                const response = {
                    htmlAttributions: htmlAttributions,
                    photoRef: photoReference
                };
                res.json(response);
            } else {
                // console.log("No photos found.");
                res.json({});
            }
        } else {
            // console.log("No Candidates.");
            res.json({});
        }

    } catch (error) {
        // console.error('An error occurred:', error);
        res.status(500).send('Error');
    }
});

app.get('/awake', async (req, res) => {
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
    res.send('Connection Completed');
});

app.listen(port, () => {
    console.log(`App is live on port ${port}`)
})