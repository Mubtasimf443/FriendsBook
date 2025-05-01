/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import express, { Express, Request, Response, Application } from 'express';
import { PORT } from './config/env';



const app: Application = express();
const port : number = Number(PORT ?? 4000) 


app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to Express & TypeScript Server');
});

app.listen(port, () => {
    console.log(`Server is Fire at http://localhost:${port}`);
});