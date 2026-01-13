import { login } from "./authController.js";
import express from "express";

const router = express.Router();

router.post("/login", login);

// Endpoint para verificar token y recuperar rol/nombre
import { checkAdmin } from './authController.js';
router.get('/check-admin', checkAdmin);

export default router;