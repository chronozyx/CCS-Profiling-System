import { Router } from 'express';
import {
  getStudents, getStudentById, createStudent,
  updateStudent, deleteStudent, getStudentStats,
  assignFaculty, removeFaculty,
  getStudentEnrollments, enrollStudent, unenrollStudent,
} from '../controllers/student.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/stats',  authorizeRoles('admin'),                           getStudentStats);
router.get('/',       authorizeRoles('admin', 'faculty', 'student'),     getStudents);
router.get('/:id',    authorizeRoles('admin', 'faculty', 'student'),     getStudentById);
router.post('/',      authorizeRoles('admin'),                           createStudent);
router.put('/:id',    authorizeRoles('admin', 'faculty', 'student'),     updateStudent);
router.delete('/:id', authorizeRoles('admin'),                           deleteStudent);

// Faculty assignment
router.post('/:id/faculty',              authorizeRoles('admin'), assignFaculty);
router.delete('/:id/faculty/:facultyId', authorizeRoles('admin'), removeFaculty);

// Enrollments
router.get('/:id/enrollments',                    authorizeRoles('admin','faculty','student'), getStudentEnrollments);
router.post('/:id/enrollments',                   authorizeRoles('admin'),                     enrollStudent);
router.delete('/:id/enrollments/:enrollmentId',   authorizeRoles('admin'),                     unenrollStudent);

export default router;
