require('dotenv').config()

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());
router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

try{
    mongoose.connect(process.env.MONGO_URI);
    console.log('Connection successful');
}
catch(err){
    console.log(err);
}

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
  
    if (!token) {
      return res.redirect('/login'); 
    }
  
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) {
        return res.redirect('/login'); 
      }
      req.user = user;
      next(); 
    });
};

router.route('/signin')
.get((req,res)=>{
    res.render('signin')
})
.post(async (req, res) => {
    const { fname, lname, username, password1 } = req.body;
    
    try {
        
        const userExists = await User.exists({ username });
        if (userExists) {
            return res.send('User exists, try using another username');
        }
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password1, salt);
        const user = new User({ fname, lname, username, password: passwordHash});
        await user.save();
        
        res.redirect('/login');

    } catch (err) {
        console.log(err);
        return res.send('Error in Sign in, Try again!');
    }
})


router.route('/login')
.get((req,res)=>{
    res.render('login')
})
.post(async (req,res)=>{
    const {username,password} = req.body;
    const user = await User.findOne({username});
    if(user==null){
        return res.redirect('/login')
    }
    const isValid=bcrypt.compareSync(password, user.password);
    if(!isValid){
        return res.render('login',{message:"Invalid username or password!"});
    }
    const payload={
        'id':user._id,
        'username':user.username
    }
    const token=jwt.sign(payload,process.env.SECRET_KEY,{expiresIn:'1h'});

    res.cookie('token',token,{httpOnly:true});

    return res.redirect('/');
    
})


router.get('/', authenticateToken, async (req, res) => {
    var exercises=[]
    try{
        const decoded = jwt.verify(req.cookies.token, process.env.SECRET_KEY);
        const id=decoded.id;
        const user = await User.findOne({_id:id});
        exercises = user.exercises.map(exercise => ({
            ...exercise.toObject(),
            date: exercise.date.toDateString()
        }));
        const page = parseInt(req.query.page)||1;
        const limit = parseInt(req.query.limit)||10;
        const totalPages = Math.ceil(exercises.length / limit);

        const start= (page-1)*limit;
        const end = page*limit;

        const paginatedExercises = exercises.splice(start,end);

        res.render('home',{exercises:paginatedExercises,page:page,totalPages:totalPages,limit:limit});
    }
    catch(err){
        console.log(err);
        return res.render('login')
    }
    
});

router.get('/logout',authenticateToken,(req,res)=>{
    res.clearCookie('token');
    return res.redirect('/login');
})

router.get('/add',authenticateToken,(req,res)=>{
    return res.render('add');
})

router.post('/add',authenticateToken,async (req,res)=>{
    const {date,duration,description} = req.body;
    const exercise = {
        date:date,
        duration:duration,
        description:description
    }
    let decoded,id;
    try{
        decoded = jwt.verify(req.cookies.token, process.env.SECRET_KEY);
        id=decoded.id;
    }
    catch(err){
        console.log(err);
        return res.render('login',{message:"Session expired, Login again"})
    }

    try{
        const user = await User.findOne({_id:id});
        user.exercises.push(exercise);
        await user.save();
        return res.redirect('/')
    }
    catch(err){
        console.log(err);
        return res.render('add',{message:"Could not add, Try again"})
    }
})

router.get('/delete/:idx',authenticateToken,async (req,res)=>{
    let decoded,id;
    try{
        decoded = jwt.verify(req.cookies.token, process.env.SECRET_KEY);
        id=decoded.id;
    }
    catch(err){
        console.log(err);
        return res.render('login',{message:"Session expired, Login again"})
    }

    try{
        const user = await User.findById(id);
        user.exercises.splice(req.params.idx, 1);
        await user.save();
        return res.redirect('/');
    }
    catch(err){
        return res.send('Could not delete');
    }

})



module.exports=router