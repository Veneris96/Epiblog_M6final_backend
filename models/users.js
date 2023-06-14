import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        max: 30
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: false,
        default: "user"
    },

    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'postsModel',
        default: []
    }]
}, { timestamps: true, strict: true })

const UsersModel = mongoose.model('usersModel', UserSchema, 'users')
export default UsersModel