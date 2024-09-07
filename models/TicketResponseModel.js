import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Ticket from "./TicketModel.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const TicketResponse = db.define('ticketresponse', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Ticket,  // Referencing the Ticket table
            key: 'id'
        },
        validate: {
            notEmpty: true
        }
    },
    description: {
        type: DataTypes.TEXT,  // Adding description as TEXT
        allowNull: true
    },
    insert_link: {
        type: DataTypes.STRING,  // URL as a string
        allowNull: false,
        validate: {
            isUrl: true  // Ensure valid URL
        }
    },
    attachment: {
        type: DataTypes.BLOB('medium'),  // Storing files as binary data
        allowNull: true
    },
    file_name: {
        type: DataTypes.STRING,  // Store the file name
        allowNull: true
    },
    mime_type: {
        type: DataTypes.STRING,  // Store the MIME type (e.g., image/jpeg, application/pdf)
        allowNull: true
    },
    author: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Users,  // Referencing the Users table
            key: 'id'
        },
        validate: {
            notEmpty: true
        }
    }
}, {
    freezeTableName: true
});

// Define associations
Ticket.hasOne(TicketResponse, { foreignKey: 'ticket_id', as: 'response' });
TicketResponse.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });

Users.hasMany(TicketResponse, { foreignKey: 'author', as: 'authoredResponses' });
TicketResponse.belongsTo(Users, { foreignKey: 'author', as: 'authorInfo' });

export default TicketResponse;
