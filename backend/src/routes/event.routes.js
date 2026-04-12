import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../controllers/event.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.get('/',       authorizeRoles('admin', 'faculty', 'student'), getEvents);
router.get('/:id',    authorizeRoles('admin', 'faculty', 'student'), getEventById);
router.post('/',      authorizeRoles('admin'),                        createEvent);
router.put('/:id',    authorizeRoles('admin'),                        updateEvent);
router.delete('/:id', authorizeRoles('admin'),                        deleteEvent);

export default router;
