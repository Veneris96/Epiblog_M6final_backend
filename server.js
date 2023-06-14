import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path, {dirname} from "path"
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

const PORT = 5050
const app = express()

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url));

//routes imports
import usersRoute from "./routes/users.js"
import postsRoute from "./routes/posts.js"
import loginRoute from "./routes/login.js"
import githubRoute from "./routes/gitHubAuth.js"

//middlewares
app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname,'./uploads')))

//utilizzo delle routes 
app.use('/', usersRoute)
app.use('/', loginRoute)
app.use('/', postsRoute)
app.use('/', githubRoute)



mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on("error", console.error.bind(console, "Failed to connect do DB"))
db.once("open", () => {
    console.log("Database connected successfully")
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))