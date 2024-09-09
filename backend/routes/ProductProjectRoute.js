import express from "express";
import {
    getProductProjects,
    getProductProjectById,
    createProductProject,
    patchProductProject,
    deleteProductProject,
    countProductProjects
} from "../controllers/ProductProjectController.js";
import { verifyUser, adminOnly } from "../middleware/AuthUser.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.get('/productprojects', verifyUser, getProductProjects);
router.get('/total/productprojects', verifyUser, countProductProjects);
router.get('/productprojects/:id', verifyUser, getProductProjectById);
router.post('/productprojects', verifyUser, adminOnly, upload.single('profile_picture'), createProductProject);
router.patch('/productprojects/:id', verifyUser, adminOnly, upload.single('profile_picture'), patchProductProject);
router.delete('/productprojects/:id', verifyUser, adminOnly, deleteProductProject);

export default router;
