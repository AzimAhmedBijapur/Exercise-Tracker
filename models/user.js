const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema(
    {
        fname:String,
        lname:String,
        username:String,
        password:String,
        exercises:[{date:Date,duration:Number,description:String}]
    }
)

const userModel = mongoose.model('User',userSchema)

module.exports=userModel