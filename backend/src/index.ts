/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import express, { Request, Response,  json as ExpressJsonMidleware , urlencoded, RequestHandler } from 'express';
import { NODE_ENV, PORT } from './config/env';
import { connectDB } from './config/connectDB';
import authRouter from './main_routes/auth';
import searchRouter from './main_routes/search';
import assetsRouter from './main_routes/assets';
// import profileRouter from './main_routes/profile';
// import cronJobsRouter from './main_routes/cron-jobs';
import dataRouter from './main_routes/data';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { cors } from './config/cors';
import { createServer } from 'node:http';
import {Server} from 'socket.io'
import { validateBothProfiledUser } from './lib/middlewares/auth.middleware';
import { randomVideoCallSocketService } from './sockets/randomVideoCall.socket';




async function main() {

    // Variables
    const app: express.Application = express();
    const port: number = Number(PORT ?? 4000) 
    const server= createServer(app).listen(port) ;
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['POST', 'GET', 'DELETE', 'PUT']
        }
    });





    randomVideoCallSocketService.getInstance(io.of('/random-video-call'));
    
    let notificationIo = io.of('/notifications');

    // Environmemt
    await connectDB();
    app.use(cookieParser());
    app.use(ExpressJsonMidleware());
    app.use(express.static('public'));
    app.use(cors)
    app.set('view engine' , 'ejs')
   
    NODE_ENV === 'developement' && app.use(morgan('dev'));
    


    // routes
    app.use('/api/auth', authRouter);
    app.use('/api/search', searchRouter);
    app.use('/api/assets', assetsRouter);
    // app.use('/api/profile', profileRouter);
    app.use('/api/data', dataRouter);
    // app.use('/api/cron-jobs', cronJobsRouter);



    app.get('/video-call' , async function (req , res ) {
        res.render('index')
    })
    
    // app.listen(port ,() =>   )
   
    console.log(`Server is Fire at http://localhost:${port}`)
}
main();