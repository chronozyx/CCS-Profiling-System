import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.get('/', authorizeRoles('admin', 'faculty'), getDashboardStats);

export default router;
