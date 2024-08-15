const express = require('express')

const app = express()

const userRouter = require('./routes/routes')

app.set('view engine','ejs')

app.use(express.json())

app.use(express.urlencoded({extended:true}))

app.use(express.static('public'))

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader("Access-Control-Allow-Methods", "PATCH, POST, GET, PUT, DELETE, OPTIONS");
    next();
});

app.listen(3000)


app.use('/',userRouter)