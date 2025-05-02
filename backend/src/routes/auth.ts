/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { Router } from "express";
import express, { Request, Response } from 'express';
import { cors } from '../config/cors'
import crypto from "crypto"
import jwt from 'jsonwebtoken';
import { catchError } from "../lib/core/catchError";
import { z } from 'zod';
import { User } from '../models/user';
import { comparePasswords, GenerateOtp, generateSalt, giveAuthSessionId, hashPassword } from '../lib/core/auth';


const router: Router = Router();


router.post('/create-registration-session' , async function (req :Request, res :Response) {
    try {
        
    } catch (error) {
        catchError(error, res)
    }
});



export default router;