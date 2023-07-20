const dropAwardTableSQL = 'DROP TABLE IF EXISTS Award';
const dropRestaurantTableSQL = 'DROP TABLE IF EXISTS Restaurant';

const createRestaurantTableSQL = `CREATE TABLE Restaurant (
    id INT NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (id),
    Name VARCHAR(90),
    Address VARCHAR(150),
    Location VARCHAR(50),
    Price VARCHAR(5),
    Cuisine VARCHAR(90),
    Longitude DECIMAL(11,7),
    Latitude DECIMAL(11,7),
    PhoneNumber VARCHAR(15),
    Url VARCHAR(255),
    WebsiteUrl VARCHAR(255),
    Award VARCHAR(50),
    FacilitiesAndServices VARCHAR(350)
)`;


const createAwardTableSQL = `CREATE TABLE Award (
    id INT NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (id),
    Distinction VARCHAR(16),
    Description VARCHAR(300)
)`;

module.exports = {
  dropAwardTableSQL,
  dropRestaurantTableSQL,
  createAwardTableSQL,
  createRestaurantTableSQL,
};