import TicketResponse from "../models/TicketResponseModel.js";
import Ticket from "../models/TicketModel.js";
import User from "../models/UserModel.js";
import fs from 'fs';
import { Readable } from 'stream'; 

// Create a ticket response
export const createTicketResponse = async (req, res) => {
    const { ticket_id, insert_link, description } = req.body;
    const author = req.userId; // Assuming authentication middleware sets req.userId

    try {
        // Fetch the ticket and validate its existence
        const ticket = await Ticket.findOne({ where: { id: ticket_id } });
        if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

        // Fetch the user and validate their role
        const user = await User.findOne({ where: { id: author } });
        if (!user) return res.status(404).json({ msg: "User not found" });

        // Validate if the user is 'teknis' and if they are assigned to the ticket
        if (user.role === 'teknis' && ticket.assigned_tech !== author) {
            return res.status(403).json({ msg: "You are not assigned to this ticket" });
        }

        // Check if a response already exists for this ticket
        const existingResponse = await TicketResponse.findOne({ where: { ticket_id } });
        if (existingResponse) {
            return res.status(400).json({ msg: "A response for this ticket already exists" });
        }

        // Handle file attachment if it exists
        let attachment = null;
        let file_name = null;
        let mime_type = null;

        if (req.file) {
            attachment = fs.readFileSync(req.file.path);  // Read the file from disk
            file_name = req.file.originalname;            // Store the original filename
            mime_type = req.file.mimetype;                // Store the file's MIME type

            // Optional: delete file after reading to prevent storage issues
            fs.unlinkSync(req.file.path);
        }

        // Create the ticket response
        await TicketResponse.create({
            ticket_id,
            description,
            insert_link,
            attachment,
            file_name,
            mime_type,
            author
        });

        // Update the ticket status to "done" and set issue_fix_date to current date
        await Ticket.update(
            { 
                status: "done", 
                issue_fixed_date: new Date() // Set issue_fix_date to the current date
            }, 
            { where: { id: ticket_id } }
        );

        res.status(201).json({ msg: "Response created successfully and ticket status updated to 'done'" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Function to get all ticket responses
export const getTicketResponses = async (req, res) => {
    const userId = req.userId;
    const userRole = req.role; // Assuming the middleware sets req.role

    try {
        let responses;

        // Admin: Get all ticket responses
        if (userRole === 'admin') {
            responses = await TicketResponse.findAll({
                attributes: ['uuid', 'insert_link', 'file_name', 'description', 'author'], // Exclude attachment, include file_name and description
                include: [
                    {
                        model: Ticket,
                        attributes: ['uuid', 'name_issue'],
                        as: 'ticket'
                    },
                    {
                        model: User,
                        attributes: ['name'],
                        as: 'authorInfo'
                    }
                ]
            });
        }

        // Teknis: Get ticket responses created by themselves (author is themselves)
        else if (userRole === 'teknis') {
            responses = await TicketResponse.findAll({
                where: { author: userId }, // Filter by author (the user themselves)
                attributes: ['uuid', 'insert_link', 'file_name', 'description', 'author'], // Exclude attachment, include file_name and description
                include: [
                    {
                        model: Ticket,
                        attributes: ['uuid', 'name_issue'],
                        as: 'ticket'
                    },
                    {
                        model: User,
                        attributes: ['name'],
                        as: 'authorInfo'
                    }
                ]
            });
        }

        // Non-teknis: Get ticket responses for tickets they created
        else if (userRole === 'non-teknis') {
            responses = await TicketResponse.findAll({
                include: [
                    {
                        model: Ticket,
                        where: { author: userId }, // Filter by tickets the user created
                        attributes: ['uuid', 'name_issue'],
                        as: 'ticket'
                    },
                    {
                        model: User,
                        attributes: ['name'],
                        as: 'authorInfo'
                    }
                ],
                attributes: ['uuid', 'insert_link', 'file_name', 'description', 'author'] // Exclude attachment, include file_name and description
            });
        }

        // Manager: Get ticket responses for tickets where they are the assigned manager
        else if (userRole === 'manager') {
            responses = await TicketResponse.findAll({
                include: [
                    {
                        model: Ticket,
                        where: { assigned_manager: userId }, // Filter by tickets assigned to the manager
                        attributes: ['uuid', 'name_issue'],
                        as: 'ticket'
                    },
                    {
                        model: User,
                        attributes: ['name'],
                        as: 'authorInfo'
                    }
                ],
                attributes: ['uuid', 'insert_link', 'file_name', 'description', 'author'] // Exclude attachment, include file_name and description
            });
        }

        // If no responses were fetched, return a 404
        if (!responses || responses.length === 0) {
            return res.status(404).json({ msg: "No ticket responses found" });
        }

        res.status(200).json(responses);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getResponsesByTicketId = async (req, res) => {
    const ticket_id = req.params.ticket_id;
    const userId = req.userId;  // Assuming req.userId is set by authentication middleware
    const userRole = req.role;  // Assuming req.role is set by authentication middleware

    try {
        // Fetch the ticket to validate existence and obtain its data
        const ticket = await Ticket.findOne({ where: { id: ticket_id } });
        if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

        let responses;

        // Admins can access any ticket's responses
        if (userRole === 'admin') {
            responses = await TicketResponse.findAll({
                where: { ticket_id },
                attributes: ['uuid', 'insert_link', 'file_name', 'description', 'author'], // Exclude attachment, include file_name and description
                include: [{ model: User, attributes: ['name'], as: 'authorInfo' }]
            });
            return res.status(200).json(responses);
        }

        // Teknis: Can access only responses from tickets assigned to them
        if (userRole === 'teknis' && ticket.assigned_tech === userId) {
            responses = await TicketResponse.findAll({
                where: { ticket_id },
                attributes: ['uuid', 'insert_link', 'file_name', 'description', 'author'], // Exclude attachment, include file_name and description
                include: [{ model: User, attributes: ['name'], as: 'authorInfo' }]
            });
            return res.status(200).json(responses);
        }

        // Non-teknis: Can access responses from tickets they created
        if (userRole === 'non-teknis' && ticket.author === userId) {
            responses = await TicketResponse.findAll({
                where: { ticket_id },
                attributes: ['uuid', 'insert_link', 'file_name', 'description', 'author'], // Exclude attachment, include file_name and description
                include: [{ model: User, attributes: ['name'], as: 'authorInfo' }]
            });
            return res.status(200).json(responses);
        }

        // Manager: Can access responses from tickets where they are the assigned manager
        if (userRole === 'manager' && ticket.assigned_manager === userId) {
            responses = await TicketResponse.findAll({
                where: { ticket_id },
                attributes: ['uuid', 'insert_link', 'file_name', 'description', 'author'], // Exclude attachment, include file_name and description
                include: [{ model: User, attributes: ['name'], as: 'authorInfo' }]
            });
            return res.status(200).json(responses);
        }

        // If none of the conditions are met, return 403 Forbidden
        return res.status(403).json({ msg: "Access denied" });

    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get a single response by ID
export const getTicketResponseById = async (req, res) => {
    const response_id = req.params.id;
    const userId = req.userId;  // Assuming req.userId is set by authentication middleware
    const userRole = req.role;  // Assuming req.role is set by authentication middleware

    try {
        // Fetch the ticket response along with associated ticket and author information
        const response = await TicketResponse.findOne({
            where: { uuid: response_id },
            attributes: ['uuid', 'insert_link', 'file_name', 'description', 'author'], // Exclude attachment, include file_name and description
            include: [
                {
                    model: Ticket,
                    attributes: ['uuid', 'name_issue', 'author', 'assigned_manager'],
                    as: 'ticket'
                },
                {
                    model: User,
                    attributes: ['name'],
                    as: 'authorInfo'
                }
            ]
        });

        // If the response is not found, return 404
        if (!response) return res.status(404).json({ msg: "Response not found" });

        // Admins can access any ticket response
        if (userRole === 'admin') {
            return res.status(200).json(response);
        }

        // Teknis: Can access only their own responses (where author is themselves)
        if (userRole === 'teknis' && response.author === userId) {
            return res.status(200).json(response);
        }

        // Non-teknis: Can access responses from tickets they created
        if (userRole === 'non-teknis' && response.ticket.author === userId) {
            return res.status(200).json(response);
        }

        // Manager: Can access responses from tickets where they are the assigned manager
        if (userRole === 'manager' && response.ticket.assigned_manager === userId) {
            return res.status(200).json(response);
        }

        // If none of the conditions are met, return 403 Forbidden
        return res.status(403).json({ msg: "Access denied" });

    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const downloadAttachment = async (req, res) => {
    const responseId = req.params.id;

    try {
        // Fetch the ticket response to get file details
        const response = await TicketResponse.findOne({ where: { uuid: responseId } });
        if (!response) return res.status(404).json({ msg: 'Response not found' });

        const { file_name, mime_type, attachment } = response;

        // Check if there's an attachment
        if (!attachment) return res.status(404).json({ msg: 'No attachment found' });

        // Set headers for file download
        res.setHeader('Content-Type', mime_type);
        res.setHeader('Content-Disposition', `attachment; filename=${file_name}`);

        // Convert the buffer to a readable stream and pipe it to the response
        const stream = Readable.from(attachment);
        stream.pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ msg: error.message });
    }
};

// Update a ticket response by ID
export const updateTicketResponse = async (req, res) => {
    const response_id = req.params.id;
    const { insert_link } = req.body;
    const author = req.userId; // Assuming authentication middleware sets req.userId

    try {
        // Find the ticket response by its UUID
        const response = await TicketResponse.findOne({ where: { uuid: response_id } });
        if (!response) return res.status(404).json({ msg: "Response not found" });

        // Authorization check: Ensure that only the author can update their response
        if (response.author !== author) {
            return res.status(403).json({ msg: "You are not authorized to update this response" });
        }

        // Update the insert_link if it's provided in the request body
        if (insert_link !== undefined) {
            response.insert_link = insert_link;
        }

        // Handle file attachment update, if a new file is uploaded
        if (req.file) {
            const attachment = fs.readFileSync(req.file.path);  // Read the new file from disk
            const file_name = req.file.originalname;            // Store the new filename
            const mime_type = req.file.mimetype;                // Store the new MIME type

            // Update the attachment fields
            response.attachment = attachment;
            response.file_name = file_name;
            response.mime_type = mime_type;

            // Optional: delete file after reading to prevent storage issues
            fs.unlinkSync(req.file.path);
        }

        // Save the updated response to the database
        await response.save();

        res.status(200).json({ msg: "Response updated successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Delete a ticket response by ID
export const deleteTicketResponse = async (req, res) => {
    const response_id = req.params.id;
    const author = req.userId; // Assuming authentication middleware sets req.userId

    try {
        const response = await TicketResponse.findOne({ where: { uuid: response_id } });
        if (!response) return res.status(404).json({ msg: "Response not found" });

        // Authorization check
        if (response.author !== author) {
            return res.status(403).json({ msg: "You are not authorized to delete this response" });
        }

        await response.destroy();

        res.status(200).json({ msg: "Response deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
