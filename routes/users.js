import express from 'express'
import UsersModel from '../models/users.js'
import bcrypt from 'bcrypt'
import logger from '../middlewares/logger.js'
import cacheMiddleware from '../middlewares/cacheMiddleware.js'
import validateUser from "../middlewares/validateUser.js"

const router = express.Router()

//GET
router.get('/users', [cacheMiddleware, logger], async (req, res) => {
    const { page = 1, pageSize = 8 } = req.query
    try {
        const users = await UsersModel.find()
            .populate('posts', 'title content author') /* REFERENCE */
            .limit(pageSize)
            .skip((page - 1) * pageSize)

        const totalUsers = await UsersModel.count()

        res.status(200).send({
            cout: totalUsers,
            currentPage: + page,
            totalPages: Math.ceil(totalUsers / pageSize),
            users
        })
    } catch (error) {
        res.status(500).send({
            message: "Errore interno del server",
            stausCode: 500
        })
    }
})

//POST 
router.post('/users/new', validateUser, async (req, res) => {
    //hash password
    const genSalt = await bcrypt.genSalt(10) //complessità dell'algoritmo di criptazione
    const hashedPassword = await bcrypt.hash(req.body.password, genSalt)

    const user = new UsersModel({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role
    })
    try {
        const userExist = await UsersModel.findOne({ email: req.body.email })
        if (userExist) {
            return res.status(409).send({
                message: "Email già esistente",
                stausCode: 409
            })
        }
        const newUser = await user.save();
        res.status(201).send({
            message: "Uente registrato!",
            stausCode: 201,
            payload: newUser
        })
    } catch (error) {
        res.status(500).send({
            message: "Errore interno del server",
            stausCode: 500
        })
    }
})

//PATCH
router.patch('/users/:id', async (req, res) => {
    const { id } = req.params;
    const userExist = await UsersModel.findById(id)
    if (!userExist) {
        return res.status(404).send({
            message: "Utente inesistente",
            stausCode: 404
        })
    }
    try {
        const userID = id;
        const dataUpdated = req.body;
        const options = { new: true } //new: true fa si che venga mostrato l'utente aggiornato
        const result = await UsersModel.findByIdAndUpdate(userID, dataUpdated, options)
        res.status(200).send({
            message: "Utente modificato",
            stausCode: 200
        })
    } catch (error) {
        res.status(500).send({
            message: "Errore interno del server",
            stausCode: 500
        })
    }
})

//DELETE
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const userExist = await UsersModel.findByIdAndDelete(id)
        if (!userExist) {
            return res.status(404).send({
                message: "Utente non trovato",
                statusCode: 404
            })
        }
        res.status(200).send({
            message: `Utente con id ${id} rimosso dal DB`,
            statusCode: 200
        })
    } catch (error) {
        res.status(500).send({
            message: "Errore interno del server",
            stausCode: 500
        })
    }
})

export default router