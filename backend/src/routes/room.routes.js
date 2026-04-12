import { Router } from 'express';
import { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } from '../controllers/room.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.get('/',       authorizeRoles('admin', 'faculty', 'student'), getRooms);
router.get('/:id',    authorizeRoles('admin', 'faculty', 'student'), getRoomById);
router.post('/',      authorizeRoles('admin'),                        createRoom);
router.put('/:id',    authorizeRoles('admin'),                        updateRoom);
router.delete('/:id', authorizeRoles('admin'),                        deleteRoom);

export default router;
