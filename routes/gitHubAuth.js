import express from "express";
import session from "express-session"
import passport from "passport"
import { Strategy as GithubStrategy } from 'passport-github2'
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
dotenv.config()

const gitRouter = express.Router()

gitRouter.use(
    session({
        secret: process.env.GITHUB_CLIENT_SECRET,
        resave: false,
        saveUninitialized: false
    })
)

gitRouter.use(cookieParser())
gitRouter.use(passport.initialize())
gitRouter.use(passport.session())

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    done(null, user)
})

passport.use(
    new GithubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callBackURL: process.env.GITHUB_CALLBACK_URL
    }, (accessToken, refreshToken, profile, done) => {
        return done(null, profile)
    })
)

gitRouter.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }))

gitRouter.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
    const user = req.user;

    const token = jwt.sign(user, process.env.SECRET_JWT_KEY);
    const redirectUrl = `http://localhost:3000/success?token=${encodeURIComponent(token)}`;
    res.redirect(redirectUrl)
})

gitRouter.get("/success", (req, res) => {
    if (req.user) {
        const username = req.user.username
        console.log(`welcome back, ${username}`)
    } else {
        console.log("Please log in first")
    }
    res.redirect("http://localhost:3000/homepage")
})

gitRouter.get("/decode-cookie", (req, res) => {
    const cookie = req.cookies["connect.sid"]
    const decodedCookie = decodeURIComponent(cookie)

    res.send(decodedCookie)
})

export default gitRouter