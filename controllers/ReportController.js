import Ticket from "../models/TicketModel.js";
import User from "../models/UserModel.js";
import ProductProject from "../models/ProductProjectModel.js";
import ExcelJS from 'exceljs';

// Function to get all tickets or filter based on role, with XLSX support
export const getReports = async (req, res) => {
    try {
        const userId = req.userId; // req.userId is set by authentication middleware
        const user = await User.findOne({ where: { id: userId } });

        if (!user) return res.status(404).json({ msg: "User not found" });

        const { role } = user;
        const format = req.query.format; // Check for format parameter

        // Determine query conditions based on role
        const queryConditions = {
            attributes: ['id', 'status', 'priority', 'start_date', 'due_date', 'issue_fixed_date', 'issue_type', 'name_issue', 'description'],
            include: [
                { model: User, attributes: ['name'], as: 'authorInfo' },
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

        const tickets = await Ticket.findAll(queryConditions);

        // Check if the format is XLSX
        if (format === 'xlsx') {
            // Create a new workbook and worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Tickets');

            // Add header row
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Reporter', key: 'authorInfo', width: 20 },
                { header: 'Assignee', key: 'assignedTech', width: 20 },
                { header: 'Issue Type', key: 'issue_type', width: 20 },
                { header: 'Project Name', key: 'project', width: 20 },
                { header: 'Issue Name', key: 'name_issue', width: 30 },
                { header: 'Description', key: 'description', width: 40 },
                { header: 'Priority', key: 'priority', width: 10 },
                { header: 'Start Date', key: 'start_date', width: 20 },
                { header: 'Due Date', key: 'due_date', width: 20 },
                { header: 'Issue Fixed Date', key: 'issue_fixed_date', width: 20 },
                { header: 'Status', key: 'status', width: 15 }
            ];

            // Add data rows
            tickets.forEach(ticket => {
                worksheet.addRow({
                    id: ticket.id,
                    uuid: ticket.uuid,
                    status: ticket.status,
                    priority: ticket.priority,
                    start_date: ticket.start_date,
                    due_date: ticket.due_date,
                    issue_fixed_date: ticket.issue_fixed_date,
                    issue_type: ticket.issue_type,
                    name_issue: ticket.name_issue,
                    description: ticket.description,
                    authorInfo: ticket.authorInfo ? ticket.authorInfo.name : '',
                    assignedTech: ticket.assignedTech ? ticket.assignedTech.name : '',
                    project: ticket.project ? ticket.project.name : ''
                });
            });

            // Set response headers for file download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=tickets.xlsx');

            // Write the workbook to the response
            await workbook.xlsx.write(res);
            res.end(); // End the response
        } else {
            // If not XLSX, return JSON response as usual
            res.status(200).json(tickets);
        }
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Function to get all tickets or filter based on role
export const showReports = async (req, res) => {
    try {
        const userId = req.userId; // req.userId is set by authentication middleware
        const user = await User.findOne({ where: { id: userId } });

        if (!user) return res.status(404).json({ msg: "User not found" });

        const { role } = user;

        // Determine query conditions based on role
        const queryConditions = {
            attributes: ['id', 'uuid', 'issue_type', 'priority', 'due_date', 'issue_fixed_date', 'status'],
            include: [
                { model: User, attributes: ['name'], as: 'authorInfo' },
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