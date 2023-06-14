import bcrypt from "bcrypt"
import { Router } from "express"
import UsersModel from "../models/users.js"
import jwt from "jsonwebtoken"

const router = Router()

router.post("/login", async (req, res) => {
    const user = await UsersModel.findOne({ email: req.body.email })
    if (!user) {
        return res.status(404).send({
            message: "User not found"
        })
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if (!validPassword) {
        return res.status(400).send({
            message: "Wrong username or password" /**È importante non rivelare mai all'utente quale specifico parametro è errato */
        })
    }

    //viene generato un token da mandare al frontend
    const token = jwt.sign({
        email: user.email,
        username: user.username,
        role: user.role,
        _id: user._id
        
    }, process.env.SECRET_JWT_KEY, {
        expiresIn: "24h"
    })

    return res.header("auth", token).status(200).send({
        token
    })
})

export default router