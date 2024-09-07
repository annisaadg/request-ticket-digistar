import express from "express";
import {
    createTicketResponse,
    getTicketResponses,
    getResponsesByTicketId,
    getTicketResponseById,
    downloadAttachment,
    updateTicketResponse,
    deleteTicketResponse
} from "../controllers/TicketResponseController.js";
import { verifyUser, roleCheck } from "../middleware/AuthUser.js";
import upload from "../middleware/multer.js";

const router = express.Router();

// Define allowed roles for specific routes
const allowedRoles = ['admin', 'teknis'];

// Apply middleware and route handlers
router.get('/ticket-responses', verifyUser, getTicketResponses);
router.get('/ticket-responses/:id', verifyUser, getTicketResponseById);
router.get('/tickets/:ticket_id/responses', verifyUser, getResponsesByTicketId);
router.get('/attachments/:id', downloadAttachment);
router.post('/ticket-responses', verifyUser, upload.single('attachment'), roleCheck(allowedRoles), createTicketResponse);
router.patch('/ticket-responses/:id', verifyUser, upload.single('attachment'), roleCheck(allowedRoles), updateTicketResponse);
router.delete('/ticket-responses/:id', verifyUser, roleCheck(allowedRoles), deleteTicketResponse);

export default router;
