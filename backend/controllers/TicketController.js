import Ticket from "../models/TicketModel.js";
import User from "../models/UserModel.js";
import ProductProject from "../models/ProductProjectModel.js";
import { Readable } from 'stream'; 

export const downloadTicketAttachment = async (req, res) => {
    const ticketId = req.params.id;

    try {
        // Fetch the ticket to get file details
        const ticket = await Ticket.findOne({ where: { uuid: ticketId } });
        if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

        const { attachment_file, attachment_filename, attachment_mimetype } = ticket;

        // Check if there's an attachment
        if (!attachment_file) return res.status(404).json({ msg: 'No attachment found' });

        // Set headers for file download
        res.setHeader('Content-Type', attachment_mimetype);
        res.setHeader('Content-Disposition', `attachment; filename=${attachment_filename}`);

        // Convert the buffer to a readable stream and pipe it to the response
        const stream = Readable.from(attachment_file);
        stream.pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ msg: error.message });
    }
};

// Function to get all tickets or filter based on role
export const getTickets = async (req, res) => {
    try {
        const userId = req.userId; // req.userId is set by authentication middleware
        const user = await User.findOne({ where: { id: userId } });

        if (!user) return res.status(404).json({ msg: "User not found" });

        const { role } = user;

        // Determine query conditions based on role
        const queryConditions = {
            attributes: ['id', 'uuid', 'status', 'priority', 'start_date', 'due_date', 'issue_type', 'name_issue', 'description', 'attachment_filename', 'attachment_link', 'author', 'assigned_manager', 'assigned_tech', 'product_project_id'],
            include: [
                { model: User, attributes: ['name'], as: 'assignedManager' },
                { model: User, attributes: ['name'], as: 'assignedTech' },
                { model: ProductProject, attributes: ['name'], as: 'project' }
            ]
        };

        if (role === 'user') {
            queryConditions.where = { author: userId };
        } else if (role === 'teknis') {
            queryConditions.where = { assigned_tech: userId };
        } else if (role === 'manager') {
            queryConditions.where = { assigned_manager: userId };
        }

        const response = await Ticket.findAll(queryConditions);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Function to get a ticket by ID with role-based access
export const getTicketById = async (req, res) => {
    try {
        const userId = req.userId; // req.userId is set by authentication middleware
        console.log('User ID:', userId); // Debugging
        const user = await User.findOne({ where: { id: userId } });

        if (!user) return res.status(404).json({ msg: "User not found" });

        const { role } = user;
        console.log('User Role:', role); // Debugging
        const ticketId = req.params.id;

        // Find the ticket with the specified ID
        const ticket = await Ticket.findOne({
            where: { uuid: ticketId },
            attributes: ['id', 'uuid', 'status', 'priority', 'start_date', 'due_date', 'issue_type', 'name_issue', 'description', 'attachment_filename', 'attachment_link', 'author', 'assigned_manager', 'assigned_tech', 'product_project_id'],
            include: [
                { model: User, as: 'assignedManager', attributes: ['name'] },
                { model: User, as: 'assignedTech', attributes: ['name'] },
                { model: ProductProject, as: 'project', attributes: ['name'] }
            ]
        });

        if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

        console.log('Ticket Author:', ticket.author); // Debugging

        // Check if the user has access to this ticket
        if (role === 'user' && ticket.author !== userId) {
            return res.status(403).json({ msg: "You are not authorized to view this ticket" });
        }
        if (role === 'teknis' && ticket.assigned_tech !== userId) {
            return res.status(403).json({ msg: "You are not authorized to view this ticket" });
        }
        if (role === 'manager' && ticket.assigned_manager !== userId) {
            return res.status(403).json({ msg: "You are not authorized to view this ticket" });
        }

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const createTicket = async (req, res) => {
    const { name_issue, description, status, priority, due_date, issue_type, assigned_tech, product_project_id, attachment_link } = req.body;

    try {
        // Assuming req.userId is set by the authentication middleware
        const author = req.userId;

        // Retrieve user and their role
        const user = await User.findOne({ where: { id: author } });
        if (!user) return res.status(404).json({ msg: "User not found" });

        const { role } = user;

        // Validate the product/project
        const productProject = await ProductProject.findOne({ where: { id: product_project_id }, attributes: ['pic'] });
        if (!productProject) return res.status(404).json({ msg: "Product/Project not found" });

        // Validate issue type
        const validIssueTypes = ["product", "project"];
        if (!issue_type || !validIssueTypes.includes(issue_type.toLowerCase())) {
            return res.status(400).json({ msg: "Issue type must be either 'product' or 'project'" });
        }

        // Determine the assigned manager
        const assigned_manager = productProject.pic;

        // Validate the assigned_tech field based on user role
        if (role === 'user' && assigned_tech !== undefined) {
            return res.status(403).json({ msg: "You are not authorized to set 'assigned_tech'" });
        }

        // Handling file attachment if exists
        let attachment_file = null;
        let attachment_filename = null;
        let attachment_mimetype = null;

        if (req.file) {
            attachment_file = req.file.buffer;  // Read the file from disk
            attachment_filename = req.file.originalname;       // Store the original filename
            attachment_mimetype = req.file.mimetype;           // Store the file's mimetype
        }

        const issue_fixed_date = status === 'done' ? new Date() : null;

        // Create the ticket
        await Ticket.create({
            name_issue,
            description,
            status,
            priority,
            due_date,
            issue_fixed_date,
            issue_type,
            assigned_manager,
            assigned_tech: role === 'user' ? null : assigned_tech, // Only set assigned_tech if role is not 'user'
            product_project_id,
            attachment_file,
            attachment_filename,
            attachment_mimetype,
            attachment_link,
            author  // Set the author field
        });

        res.status(201).json({ msg: "Ticket created successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const patchTicket = async (req, res) => {
    try {
        const userId = req.userId; // req.userId is set by authentication middleware
        const user = await User.findOne({ where: { id: userId } });

        if (!user) return res.status(404).json({ msg: "User not found" });

        // Find the ticket
        const ticket = await Ticket.findOne({
            where: { uuid: req.params.id }
        });
        if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

        // Determine role-based access
        const isUser = user.role === 'user';
        const isManager = user.role === 'manager';
        const isAdmin = user.role === 'admin';
        const isTeknis = user.role === 'teknis';

        // Check if the user is allowed to update this ticket
        if (isUser && ticket.author !== userId) {
            return res.status(403).json({ msg: "You are not authorized to update this ticket" });
        }

        if (isManager && ticket.assigned_manager !== userId) {
            return res.status(403).json({ msg: "You are not authorized to update this ticket" });
        }

        if (isTeknis && ticket.assigned_tech !== userId) {
            return res.status(403).json({ msg: "You are not authorized to update this ticket" });
        }

        // Initialize the updateData object
        const updateData = {};

        // Role-based updates
        if (isAdmin || isManager) {
            // Admins and Managers can update assigned_tech, status, and start_date
            if (req.body.assigned_tech !== undefined) {
                const techUser = await User.findOne({
                    where: { id: req.body.assigned_tech }
                });

                if (!techUser || techUser.role !== 'teknis') {
                    return res.status(400).json({ msg: "Assigned technician does not exist or is not a 'teknis' user" });
                }

                // If the assigned technician is changing or being set for the first time
                updateData.assigned_tech = req.body.assigned_tech;

                // Set start_date if it is being assigned for the first time
                if (!ticket.assigned_tech && req.body.assigned_tech) {
                    updateData.start_date = new Date(); // Set current date as start_date
                }
            }
            if (req.body.status !== undefined) updateData.status = req.body.status;
        }

        if (isTeknis) {
            // Technicians can only update the status field
            if (req.body.status !== undefined) {
                updateData.status = req.body.status;
            } else {
                return res.status(400).json({ msg: "Technicians must provide a status to update" });
            }
        }

        if (req.body.status === 'done') {
            updateData.issue_fixed_date = new Date();
        }

        // Validate the status field if present
        if (updateData.status && !['decline', 'to do', 'on-process', 'done'].includes(updateData.status)) {
            return res.status(400).json({ msg: "Invalid status value" });
        }

        // Update the ticket with the collected data
        const [updated] = await Ticket.update(updateData, {
            where: { uuid: req.params.id }
        });

        if (!updated) {
            return res.status(400).json({ msg: "No changes made to the ticket" });
        }

        res.status(200).json({ msg: "Ticket patched successfully" });
    } catch (error) {
        console.error(error); // Log the error to the console for debugging
        res.status(500).json({ msg: error.message });
    }
};

// Function to delete a ticket by ID
export const deleteTicket = async (req, res) => {
    try {
        const userId = req.userId; // Assuming req.userId is set by your authentication middleware
        const user = await User.findOne({ where: { id: userId } });

        if (!user) return res.status(404).json({ msg: "User not found" });

        const { role } = user;
        const ticketId = req.params.id;

        // Find the ticket with the specified ID
        const ticket = await Ticket.findOne({
            where: { uuid: ticketId }
        });

        if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

        // Authorization checks
        if (role === 'admin') {
            // Admins can delete any ticket
            await ticket.destroy();
            return res.status(200).json({ msg: "Ticket deleted successfully" });
        }

        if (role === 'user' && ticket.author === userId) {
            // Users can only delete tickets they authored
            await ticket.destroy();
            return res.status(200).json({ msg: "Ticket deleted successfully" });
        }

        // If the user is not authorized
        res.status(403).json({ msg: "You are not authorized to delete this ticket" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const countTicketsByPriority = async (req, res) => {
    try {
        const userId = req.userId; // req.userId is set by authentication middleware
        const user = await User.findOne({ where: { id: userId } });

        if (!user) return res.status(404).json({ msg: "User not found" });

        const { role } = user;

        // Determine query conditions based on role
        const queryConditions = {};

        if (role === 'user') {
            queryConditions.where = { author: userId };
        } else if (role === 'teknis') {
            queryConditions.where = { assigned_tech: userId };
        } else if (role === 'manager') {
            queryConditions.where = { assigned_manager: userId };
        }

        // Count tickets by priority
        const ticketsByPriority = await Ticket.findAll({
            attributes: [
                'priority',
                [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('priority')), 'count']
            ],
            where: queryConditions.where,
            group: ['priority']
        });

        // Count total tickets
        const totalTickets = await Ticket.count(queryConditions);

        res.status(200).json({
            ticketsByPriority,
            totalTickets
        });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const countTicketsByAssignedTech = async (req, res) => {
    try {
        const userId = req.userId; // req.userId is set by authentication middleware
        const user = await User.findOne({ where: { id: userId } });

        if (!user) return res.status(404).json({ msg: "User not found" });

        const { role } = user;

        // Determine query conditions based on role
        const queryConditions = {};

        if (role === 'user') {
            queryConditions.where = { author: userId };
        } else if (role === 'teknis') {
            queryConditions.where = { assigned_tech: userId };
        } else if (role === 'manager') {
            queryConditions.where = { assigned_manager: userId };
        }
        // Admin has no specific restrictions, so no need to modify queryConditions for them

        // Count tickets by assigned_tech and get user name
        const ticketsByAssignedTech = await Ticket.findAll({
            attributes: [
                [User.sequelize.col('assignedTech.name'), 'assignedTechName'],
                [User.sequelize.fn('COUNT', User.sequelize.col('assigned_tech')), 'count']
            ],
            include: [
                {
                    model: User,
                    attributes: [],
                    as: 'assignedTech'
                }
            ],
            where: queryConditions.where,
            group: ['assigned_tech'],
            raw: true // Return raw data for better control over output
        });

        res.status(200).json(ticketsByAssignedTech);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};