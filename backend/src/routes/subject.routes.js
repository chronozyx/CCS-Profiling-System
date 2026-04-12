import { Router } from 'express';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../controllers/subject.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);

router.get('/',       authorizeRoles('admin'),  getSubjects);
router.post('/',      authorizeRoles('admin'),  createSubject);
router.put('/:id',    authorizeRoles('admin'),  updateSubject);
router.delete('/:id', authorizeRoles('admin'),  deleteSubject);

export default router;
