const validateUser = (req, res, next) => { //senza il next la funzione si blocca
    const errors = []

    const { email, password } = req.body

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { //lancia il regex sul paramentro che vogliamo in questo caso la psw
        errors.push('Please provide a valid email address')
    }

    if (typeof password !== 'string' || password.length < 8) {
        errors.push('Password must be a string or at least with 8 characters')
    }

    if (errors.length > 0) {
        res.status(400).send({ errors })
    } else {
        next()
    }
}

export default validateUser