import express from "express";
import {
    getReports,
    showReports
} from "../controllers/ReportController.js";
import { verifyUser } from "../middleware/AuthUser.js";

const router = express.Router();

// Apply middleware and route handlers
router.get('/report', verifyUser, showReports);
router.get('/report_download', verifyUser,  getReports);

export default router;
