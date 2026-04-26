import { Router } from 'express';
import { getAuditLogs, getAuditStats, clearOldLogs, clearAllLogs } from '../controllers/audit.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// All audit routes — admin only
router.use(verifyToken, authorizeRoles('admin'));

router.get('/',       getAuditLogs);
router.get('/stats',  getAuditStats);
router.delete('/old', clearOldLogs);
router.delete('/all', clearAllLogs);

export default router;
