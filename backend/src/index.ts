/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import express, { Express, Request, Response, Application } from 'express';
import { PORT } from './config/env';
import { connectDB } from './config/connectDB';
import { cors } from './config/cors';
import authRouter from './routes/auth';
import searchRouter from './routes/search';
import assetsRouter from './routes/asset';
import userRouter from './routes/user';
import cookieParser from 'cookie-parser'

const port : number = Number(PORT ?? 4000) 
async function main() {


    // Variables
    const app: Application = express();


    // Environmemt
    await connectDB();
    app.use(cookieParser());
    app.use(express.json());



    // routes
    app.use('/api/auth' , assetsRouter);
    app.use('/api/search' , searchRouter);
    app.use('/api/assets' , assetsRouter);
    app.use('/api/auth' , userRouter);


    app.get('/', (req: Request, res: Response) => {
        res.send('Welcome to Express & TypeScript Server');
    });
    
    app.listen(port, () => {
        console.log(`Server is Fire at http://localhost:${port}`);
    });
}
main();