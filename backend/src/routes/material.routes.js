import { Router } from 'express';
import { getMaterials, createMaterial, deleteMaterial } from '../controllers/material.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.get('/',       authorizeRoles('admin', 'faculty', 'student'), getMaterials);
router.post('/',      authorizeRoles('admin', 'faculty'),             createMaterial);
router.delete('/:id', authorizeRoles('admin'),                        deleteMaterial);

export default router;
