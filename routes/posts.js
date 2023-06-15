import { Router } from "express"
import PostsModel from "../models/posts.js"
import UsersModel from "../models/users.js"
import multer from "multer"
import  {v2 as cloudinary} from "cloudinary"
import { validationResult } from "express-validator"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
    cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
    api_key: `${process.env.CLOUDINARY_API_KEY}`,
    api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
});



const MAX_FILE_SIZE = 20000000 //(KB, circa 20MB)

const posts = Router()

//si definisce la sorgente in cui andare a pescare i files necessari all'interno del disco locale
const internalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads")
    },
    filename: (req, file, cb) => {
        //metodo per rendere unico ciascun file, per evitare conflitti. Si può fare meglio in altri modi, ma anche questo funziona.
        const fileId = Date.now() + "-" + Math.round(Math.random() * 1E9)
        //ID univoco per singolo file: data odierna + trattino + numero casuale = 27052023-659846847657
        const fileExtension = file.originalname.split(".").pop()
        cb(null, `${file.fieldname}-${fileId}.${fileExtension}`)
        //filename = nome file + trattino + ID + .estensione = new_img-27052023-659846847657.png
    },
})

const internalUpload = multer({
    storage: internalStorage,
    limits: { fileSize: MAX_FILE_SIZE },
    //Questo qui sotto è un filtro opzionale per limitare l'estensione dei files che possono essere caricati
    // fileFilter: (req, file, cb) => {
    //     if (file.mimetype !== "image/png" || file.mimetype !== "image/jpg" || file.mimetype !== "jpeg") {
    //         cb(null, false)
    //         return cb(new Error("Only .png, .jpg or jpeg files are allowed"))
    //     }
    // }
})
//multer andrà a pescare i files da caricare nella cartella indicata sopra, presente sul disco locale.

//si definisce la sorgente in cui andare a pescare i files necessari da fonti esterne, in questo caso i server di Cloudinary
const cloudStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'postsImages',
        format: async (req, file) => 'jpeg',
        public_id: (req, file) => file.name
    }
})

const cloudUpload = multer({
    storage: cloudStorage,
    limits: { fileSize: MAX_FILE_SIZE },
    // fileFilter: (req, file, cb) => {
    //     if (file.mimetype !== "image/png" || file.mimetype !== "image/jpg" || file.mimetype !== "jpeg") {
    //         cb(null, false)
    //         return cb(new Error("Only .png, .jpg or jpeg files are allowed"))
    //     }
    // } 
});
//Endpoint per upload in cloudinary//


posts.get("/post", async (req, res) => {
    const { page = 1, pageSize = 20 } = req.query
    try {
        const posts = await PostsModel.find()
            .populate("author", "username email role author _id") //viene passata la stringa che contiene l'id dell'utente
            .limit(pageSize)
            .skip((page - 1) * pageSize)

        const totalPosts = await PostsModel.count()
        res.status(200).send({
            message: "Data downloaded successfully",
            statusCode: 200,
            count: totalPosts,
            currentPage: + page,
            totalPages: Math.ceil(totalPosts / pageSize),
            posts
        })
    } catch (error) {
        res.status(500).send({
            message: "Internal server error",
        })
    }
})

posts.get("/post/bytitle/:title", async (req, res) => {
    try {
        const { title } = req.params
        const postsByTitle = await PostsModel.find({
            title: {
                $regex: ".*" + title + ".*", /**controlla all'interno del titolo della query */
                $options: "i", /**i = insensitive; non fa distinzione tra maiuscole e minuscole */
            }
        })
        if (!postsByTitle || postsByTitle.length === 0) {
            return res.status(404).send({
                message: "A post with that title does not exist",
                statuscode: 404
            })
        }
        res.status(200).send({
            message: "Post found",
            statusCode: 200,
            postsByTitle
        })
    } catch (error) {
        res.status(500).send({
            message: "Internal server error"
        })
    }
})

posts.post("/post/uploadImg", internalUpload.single("img"), async (req, res) => {
    //Il nome del parametro .single dell'internalStorage deve essere lo stesso anche dell'input nel frontend   
    const url = req.protocol + "://" + req.get("host")
    //url = http o https + :// + nome dell'host su cui gira il server = http://localhost:5050
    try {
        const imgUrl = req.file.filename
        //imgUrl = nome del file
        res.status(200).json({
            img: `${url}/uploads/${imgUrl}`
            //endpoint.img = url + :// + cartella in cui caricare i files + /imgurl = "http://localhost/5050/uploads/new_img-27052023-659846847657.png" 
        })
    } catch (error) {
        console.error("File upload failed" + error)
        res.status(500).send({
            message: "File upload failed",
            statusCode: 500
        })
    }
})

posts.post('/post/cloudUpload', cloudUpload.single('img'), async (req, res) => {
    try {
        res.status(200).json({ img: req.file.path })
    } catch (error) {
        console.error('Upload fallito: ', error)
        res.status(500).send({
            message: 'File upload error',
            statusCode: 500
        })
    }
})


posts.post("/post", async (req, res) => {
    const errors = validationResult(req)

    const user = await UsersModel.findOne({ _id: req.body.author }) /* reference */

    if (!errors.isEmpty()) {
        return res.status(400).send({
            errors: errors.array(),
            statusCode: 400
        })
    }

    const post = new PostsModel({
        title: req.body.title,
        content: req.body.content,
        img: req.body.img,
        author: user._id, /* reference */
        rate: req.body.rate
    })
    try {
        const postExist = await PostsModel.findOne({ title: req.body.title })
        if (postExist) {
            return res.status(409).send({
                message: 'Esiste già un post con questo titolo',
                statusCode: 409
            })
        }
        const newPost = await post.save()
        await UsersModel.updateOne({ _id: user._id }, { $push: { posts: newPost } }) /* reference */
        res.status(201).send({
            message: 'Post salvato con successo',
            statusCode: 201,
            newPost
        })
    } catch (error) {
        res.status(500).send({
            message: "Errore interno del server",
            stausCode: 500
        })
    }
})

posts.post("/post/cloudUpload", cloudUpload.single("img"), async (req, res) => {
    try {
        res.status(200).json({
            img: req.file.path
        })
    } catch (error) {
        res.status(500).send({
            message: "Error(s) occurred during the upload",
            statusCode: 500
        })
    }
})

posts.patch("/post/:id", async (req, res) => {
    const { _id } = req.params
    const postExists = await PostsModel.findById(_id)
    if (!postExists) {
        return res.status(404).send({
            message: "Post does not exist",
            statusCode: 404
        })
    }
    try {
        const postID = _id
        const postUpdated = req.body
        const options = { new: true }
        const result = await PostsModel.findByIdAndUpdate(postID, postUpdated, options)
        res.status(200).send({
            message: "Post modified successfully",
            statusCode: 200,
            result
        })

    } catch (error) {
        res.status(500).send({
            message: "Internal server error",
            statusCode: 500
        })
    }
})

posts.delete("/post/:id", async (req, res) => {
    const { id } = req.params
    const postExists = await PostsModel.findById(id)
    if (!postExists) {
        return res.status(404).send({
            message: "Post does not exist"
        })
    }
    try {
        const postId = id
        const deletedPost = req.body
        const result = await PostsModel.findByIdAndDelete(postId, deletedPost)
        res.status(200).send({
            message: `Post deleted successfully`,
            statusCode: 200
        })
    } catch (error) {
        res.status(500).send({
            message: "Internal server error",
            statusCode: 500
        })
    }
})

export default posts