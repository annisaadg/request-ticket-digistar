import {Sequelize} from "sequelize";

const db = new Sequelize('ticketing_system', 'root', '', {
    host: "localhost",
    dialect: "mysql"
});

export default db;