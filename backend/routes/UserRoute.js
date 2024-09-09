import express from "express";
import {
    getUsers,
    getUsersTeknis,
    getUsersManager,
    getUserById,
    createUser,
    patchUser,
    deleteUser,
    countUsers
} from "../controllers/Users.js";
import { verifyUser, adminOnly, roleCheck } from "../middleware/AuthUser.js";
import upload from "../middleware/multer.js";

const router = express.Router();

const allowedRoles = ['admin', 'manager'];

router.get('/users', verifyUser, adminOnly, getUsers);
router.get('/users/teknis', verifyUser, roleCheck(allowedRoles), getUsersTeknis);
router.get('/users/manager', verifyUser, adminOnly, getUsersManager);
router.get('/total/users', verifyUser, adminOnly, countUsers);
router.get('/users/:id', verifyUser, adminOnly, getUserById);
router.post('/users', verifyUser, adminOnly, upload.single('profile_picture'), createUser);
router.patch('/users/:id', verifyUser, adminOnly, upload.single('profile_picture'), patchUser);
router.delete('/users/:id', verifyUser, adminOnly, deleteUser);

export default router;