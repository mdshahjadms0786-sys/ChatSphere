const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => e.msg),
    });
  }
  next();
};

const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validate,
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

const profileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('about')
    .optional()
    .isLength({ max: 150 })
    .withMessage('About cannot exceed 150 characters'),
  validate,
];

const groupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Group name is required'),
  body('members')
    .isArray({ min: 2 })
    .withMessage('At least 2 members required'),
  validate,
];

const messageSearchValidation = [
  body('q').optional(),
  validate,
];

module.exports = {
  registerValidation,
  loginValidation,
  profileValidation,
  groupValidation,
  messageSearchValidation,
  validate,
};
