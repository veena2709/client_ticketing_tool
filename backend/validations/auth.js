const { body } = require('express-validator');

const signupValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['client', 'agent', 'admin']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const ticketValidation = [
  body('title').trim().isLength({ min: 3 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
];

const commentValidation = [
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required')
];

module.exports = { signupValidation, loginValidation, ticketValidation, commentValidation };
