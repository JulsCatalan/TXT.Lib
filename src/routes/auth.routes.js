import { Router } from "express";
import { register_user, login_user, logout_user } from "../controllers/auth.controller.js";

const router = Router();

// Registro
router.post("/register", register_user);

// Login
router.post("/login", login_user);

// Logout
router.post("/logout", logout_user);


export default router;
