import { Router } from 'express';
import {
  getFaculty, getFacultyById, createFaculty,
  updateFaculty, deleteFaculty, getMyFacultyProfile, getFacultySubjects
} from '../controllers/faculty.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/me',            authorizeRoles('faculty'),           getMyFacultyProfile);
router.get('/:id/subjects',  authorizeRoles('admin','faculty'),   getFacultySubjects);
router.get('/',              authorizeRoles('admin'),              getFaculty);
router.get('/:id',           authorizeRoles('admin'),              getFacultyById);
router.post('/',             authorizeRoles('admin'),              createFaculty);
router.put('/:id',           authorizeRoles('admin'),              updateFaculty);
router.delete('/:id',        authorizeRoles('admin'),              deleteFaculty);

export default router;
