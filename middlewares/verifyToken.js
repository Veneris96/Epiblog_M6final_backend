import jwt from 'jsonwebtoken'

const verifyToken = (req, res, next) => {
    const token = req.header('auth')

    if (!token) {
        return res.status(401).send({
            errorType: 'Token does not exist',
            statusCode: 401,
            message: 'You need a token to access this endpoint.'
        })
    }

    try {
        const verified = jwt.verify(token, process.env.SECRET_JWT_KEY)
        req.user = verified
        
        next()
        
    } catch (error) {
        res.status(403).send({
            errorType: 'Token Error',
            statusCode: 403,
            message: 'Session token expired or no longer valid'
        })
    }
}
export default verifyToken