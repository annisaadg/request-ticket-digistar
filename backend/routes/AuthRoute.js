import express from "express";
import {Login, logOut, Me, patchMe} from "../controllers/Auth.js";

const router = express.Router();

router.get('/me', Me);
router.post('/login', Login);
router.patch('/update_profile', patchMe);
router.delete('/logout', logOut);

export default router;