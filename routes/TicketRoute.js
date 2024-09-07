import express from "express";
import {
    downloadTicketAttachment,
    getTickets,
    getTicketById,
    createTicket,
    patchTicket,
    deleteTicket,
    countTicketsByPriority,
    countTicketsByAssignedTech
} from "../controllers/TicketController.js";
import { verifyUser, roleCheck } from "../middleware/AuthUser.js";
import upload from "../middleware/multer.js";

const router = express.Router();

// Define allowed roles for specific routes
const allowedRolesForCreate = ['admin', 'user'];
const allowedRolesForDelete = ['admin', 'user'];

// Apply middleware and route handlers
router.get('/tickets_download/:id', downloadTicketAttachment);
router.get('/tickets', verifyUser, getTickets);
router.get('/total/tickets', verifyUser, countTicketsByPriority);
router.get('/total/workload', verifyUser, countTicketsByAssignedTech);
router.get('/tickets/:id', verifyUser, getTicketById);
router.post('/tickets', verifyUser, upload.single('attachment_file'), roleCheck(allowedRolesForCreate), createTicket);
router.patch('/tickets/:id', verifyUser, upload.single('attachment_file'), patchTicket);
router.delete('/tickets/:id', verifyUser, roleCheck(allowedRolesForDelete), deleteTicket);

export default router;
