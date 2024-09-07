import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const {DataTypes} = Sequelize;

const Users = db.define('users',{
    uuid:{
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate:{
            notEmpty: true
        }
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty: true,
            len: [3, 100]
        }
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate:{
            notEmpty: true,
            isEmail: true
        }
    },
    password:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty: true
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'user', 'manager', 'teknis'),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    nomor_handphone: {  
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            notEmpty: true,
            len: [10, 15] 
        }
    },
    profile_picture: {
        type: DataTypes.BLOB('medium'),  // Storing image data
        allowNull: true
    },
    profile_picture_filename: {
        type: DataTypes.STRING,  // Store original filename
        allowNull: true
    },
    profile_picture_mimetype: {
        type: DataTypes.STRING,  // Store MIME type of file
        allowNull: true
    }
},{
    freezeTableName: true
});

export default Users;