import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";
import ProductProject from "./ProductProjectModel.js";

const { DataTypes } = Sequelize;

const Ticket = db.define('ticket', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    assigned_manager: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Users,  // Referencing the Users table
            key: 'id'
        },
        validate: {
            notEmpty: true
        }
    },
    assigned_tech: {
        type: DataTypes.INTEGER,
        allowNull: true,  // Allowing NULL values
        references: {
            model: Users,  // Referencing the Users table
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('decline', 'to do', 'on-process', 'done'),
        allowNull: false,
        defaultValue: 'to do', // Default value
        validate: {
            notEmpty: true
        }
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    start_date: {
        type: DataTypes.DATEONLY,  // Date in Year-Month-Day format
        allowNull: true,
        validate: {
            isDate: true
        }
    },
    due_date: {
        type: DataTypes.DATEONLY,  // Date in Year-Month-Day format
        allowNull: false,
        validate: {
            notEmpty: true,
            isDate: true
        }
    },
    issue_fixed_date: {
        type: DataTypes.DATEONLY,  // Date in Year-Month-Day format
        allowNull: true,
        validate: {
            isDate: true
        }
    },
    issue_type: {
        type: DataTypes.ENUM('product', 'project'),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    product_project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ProductProject,  // Referencing the ProductProject table
            key: 'id'
        },
        validate: {
            notEmpty: true
        }
    },
    name_issue: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 100]  // Length constraint
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    attachment_file: {
        type: DataTypes.BLOB('medium'),  // Storing files as binary data
        allowNull: true
    },
    attachment_filename: {
        type: DataTypes.STRING,  // Store original filename
        allowNull: true
    },
    attachment_mimetype: {
        type: DataTypes.STRING,  // Store MIME type of file
        allowNull: true
    },
    attachment_link: {
        type: DataTypes.STRING,  // Store URLs as strings
        allowNull: true,
        validate: {
            isUrl: true  // Ensure valid URL
        }
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
Users.hasMany(Ticket, { foreignKey: 'assigned_manager', as: 'managerTickets' });
Users.hasMany(Ticket, { foreignKey: 'assigned_tech', as: 'techTickets' });
Users.hasMany(Ticket, { foreignKey: 'author', as: 'authoredTickets' }); // New association
ProductProject.hasMany(Ticket, { foreignKey: 'product_project_id', as: 'productTickets' });
Ticket.belongsTo(Users, { foreignKey: 'assigned_manager', as: 'assignedManager' });
Ticket.belongsTo(Users, { foreignKey: 'assigned_tech', as: 'assignedTech' });
Ticket.belongsTo(Users, { foreignKey: 'author', as: 'authorInfo' }); // New association
Ticket.belongsTo(ProductProject, { foreignKey: 'product_project_id', as: 'project' });

export default Ticket;
