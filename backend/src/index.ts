/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import express, { Request, Response,  json as ExpressJsonMidleware} from 'express';
import { NODE_ENV, PORT } from './config/env';
import { connectDB } from './config/connectDB';
import authRouter from './routes/auth';
import searchRouter from './routes/search';
import assetsRouter from './routes/asset';
import profileRouter from './routes/profile';
import dataRouter from './routes/data';

import cookieParser from 'cookie-parser';

import morgan from 'morgan';
import { cors } from './config/cors';
import { giveLocationData } from './controllers/data.controller';

const port : number = Number(PORT ?? 4000) 
async function main() {

    // Variables
    const app: express.Application = express();

    // Environmemt
    await connectDB();
    app.use(cookieParser());
    app.use(ExpressJsonMidleware());
    app.use(cors)
    
    NODE_ENV === 'developement' && app.use(morgan('dev'))
    // routes
    app.use('/api/auth' , authRouter);
    app.use('/api/search' , searchRouter);
    app.use('/api/assets' , assetsRouter);
    app.use('/api/profile' , profileRouter);
    app.use('/api/data' , dataRouter);

    app.get('/', (req: Request, res: Response) => {
        res.send('Welcome to Express & TypeScript Server');
    });
    
    app.listen(port, () => {
        console.log(`Server is Fire at http://localhost:${port}`);
    });
}
main();