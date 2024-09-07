import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";

const {DataTypes} = Sequelize;

const ProductProject = db.define('productproject',{
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
    description: { 
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    issue_type: {
        type: DataTypes.ENUM('product', 'project'),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    pic: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,  // This refers to the User model
            key: 'id'     // This refers to the 'id' column in the User model
        },
        validate: {
            notEmpty: true
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

// Define associations
User.hasMany(ProductProject, { foreignKey: 'pic' });
ProductProject.belongsTo(User, { foreignKey: 'pic' });

export default ProductProject;