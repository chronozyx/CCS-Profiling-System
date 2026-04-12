import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, resetPassword, regenerateLoginId } from '../controllers/user.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken, authorizeRoles('admin'));

router.get('/',                          getUsers);
router.post('/',                         createUser);
router.put('/:id',                       updateUser);
router.delete('/:id',                    deleteUser);
router.put('/:id/reset-password',        resetPassword);
router.post('/:id/regenerate-login-id',  regenerateLoginId);

export default router;
