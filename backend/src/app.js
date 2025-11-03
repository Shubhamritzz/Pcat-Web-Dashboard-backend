import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors(
    {
        origin: process.env.Cors_Origin ,
        credentials: true, // Allow cookies to be sent
    }
))

app.use(express.json({ // this is for json data limit and handle json data
    limit: '50mb'
}));
app.use (express.static('public')) // this is for static file like image css js
app.use(express.urlencoded( // this is for form data limit and handle data comming from url
    {extended:true, limit:'50mb'}
))
app.use(cookieParser()); // ye cookie ko handle karne ke liye use hota hai


// import routes
import userRoute from './routes/user.routes.js';
import navbarRoute from './routes/navbar.routes.js'

app.use('/api/v1/users', userRoute); // for calling api on /api/v1/user endpoint we use middleware because we have to call UserRoute from onother file

app.use('/api/v1/navbar',navbarRoute)

export { app };
