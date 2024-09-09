import {Sequelize} from "sequelize";

const db = new Sequelize('digistar', 'root', '', {
    host: "localhost",
    dialect: "mysql"
});

export default db;