const express = require('express');
const router = express.Router();
const { create, list, detail, reply, internalNote, status, assign } = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middlewares/auth');
const { ticketValidation, commentValidation } = require('../validations/auth');
const { validateRequest } = require('../middlewares/validate');

router.post('/', authenticate, authorize('client'), ticketValidation, validateRequest, create);
router.get('/', authenticate, authorize('client', 'agent', 'admin'), list);
router.get('/:id', authenticate, authorize('client', 'agent', 'admin'), detail);
router.post('/:id/reply', authenticate, authorize('client', 'agent', 'admin'), commentValidation, validateRequest, reply);
router.post('/:id/internal-note', authenticate, authorize('agent', 'admin'), commentValidation, validateRequest, internalNote);
router.patch('/:id/status', authenticate, authorize('agent', 'admin'), commentValidation, validateRequest, status);
router.patch('/:id/assign', authenticate, authorize('admin'), commentValidation, validateRequest, assign);

module.exports = router;
