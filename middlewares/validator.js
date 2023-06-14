import { body, validationResult } from 'express-validator'

const params = [
    body('title').isString().notEmpty().withMessage('title must be string'),
    body('content').isString().notEmpty().isLength({ min: 150 }).withMessage('title must be string'),
    body('category').isString().notEmpty().withMessage('title must be string')
]

const validator = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    next();
}

export { params, validator }