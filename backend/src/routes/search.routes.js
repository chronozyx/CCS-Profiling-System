import { Router } from 'express';
import { globalSearch } from '../controllers/search.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();
router.get('/', verifyToken, globalSearch);
export default router;
