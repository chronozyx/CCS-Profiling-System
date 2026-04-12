import { Router } from 'express';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../controllers/schedule.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.get('/',       authorizeRoles('admin', 'faculty', 'student'), getSchedules);
router.post('/',      authorizeRoles('admin'),                        createSchedule);
router.put('/:id',    authorizeRoles('admin'),                        updateSchedule);
router.delete('/:id', authorizeRoles('admin'),                        deleteSchedule);

export default router;
