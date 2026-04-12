import { Router } from 'express';
import { getResearch, createResearch, deleteResearch } from '../controllers/research.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.get('/',       authorizeRoles('admin', 'faculty', 'student'), getResearch);
router.post('/',      authorizeRoles('admin', 'faculty'),             createResearch);
router.delete('/:id', authorizeRoles('admin'),                        deleteResearch);

export default router;
