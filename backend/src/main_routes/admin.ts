/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { NextFunction, Request, Response, Router } from "express";
import { giveAuthSessionId } from "../controllers/auth.controller";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { User } from "../models/user";
import VideoProfile from "../models/VideoProfile";

const router : Router = Router();


router.post('/login', async function (req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { email, password } = req.body;

    let adminSettings = require('../admin.panal.settings.json');
    let {email: validEmail, password: validPassword} = adminSettings;
    
    if (email === validEmail && password === validPassword) {
        let authToken = giveAuthSessionId();

        writeFileSync(path.join(__dirname, '../admin.panal.settings.json'), JSON.stringify({
            email: validEmail,
            password: validPassword,
            auth_session: authToken 
        }));
      
        // Set auth token as cookie
        res.cookie('admin_auth_token', authToken, {
            httpOnly: true,
            sameSite : false , 
            secure: process.env.NODE_ENV === 'production',
            maxAge:24 * 60 * 60 * 1000 // 24 hours
        });
        
        return res.status(200).json({
            success: true,
            message: 'Admin login successful',
            data: { email: email , authToken}
        });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post('/is-loggedin', async function (req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const authToken = req.cookies?.admin_auth_token;
    let adminSettings =JSON.parse(readFileSync(path.join(__dirname , '../admin.panal.settings.json') , 'utf-8'))
   
    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: 'Admin is not logged in'
      });
    }
    
    
    if (adminSettings.auth_session === authToken) {
      return res.status(200).json({
        success: true,
        message: 'Admin is logged in',
        data: {
          email: adminSettings.email, 
          token : authToken
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Admin is not logged in'
      });
    }
  } catch (error) {
    next(error);
  }
});
router.use(async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const authToken = req.cookies?.admin_auth_token;
      
      if (!authToken) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Admin authentication required'
        });
      }
      
      let adminSettings = require('../admin.panal.settings.json');
      
      if (adminSettings.auth_session === authToken) {
        // Admin is authenticated, proceed to the next middleware or route handler
        next();
      } else {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid admin authentication token'
        });
      }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
)
router.get('/overview-statistics', async function (req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    // Get counts from database
    const totalUsers = await User.countDocuments();
    const onlineActiveUsers = await User.countDocuments({ status: 'online' });
    const usersJoinedThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) } // First day of current month
    });
    const premiumUsers = await User.countDocuments({ membershipType: 'premium' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const videoProfileUsers = await User.countDocuments({ hasVideoProfile: true });

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        onlineActiveUsers,
        usersJoinedThisMonth,
        premiumUsers,
        suspendedUsers,
        videoProfileUsers
      }
    });
  } catch (error) {
    console.error(error);
        return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
  }
});
router.get('/users', async function (req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const userType = req.query.usertype as string || 'all';
    
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Filter based on user type
    switch (userType) {
      case 'premium':
        query = { 
            'membership.currentMembership.requestId': { $exists: true },
            'membership.currentMembership.membership_exipation_date': { $exists: true } 
        };
        break;
      case 'active':
        query = {
            'onlineStatus.isOnline': true,
        };
        break;
      case 'suspended':
        query = {  'suspension.isSuspended': true };
        break;
      case 'new':
        // Users created in the last 7 days
        query = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      default:
        // 'all' - no filter
        break;
    }
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id name email profileImage suspension onlineStatus membership address');
      
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);
    
    
    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});
router.get('/users/search', async function (req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10,15}$/;
    

    const {  searchTerm, userType } = req.query;

    if (typeof searchTerm !== 'string' || !(userType === 'video' || userType == 'matrimony')) {
        return res.sendStatus(400);
    }

    let filterbyEmail = true ;
    if (emailRegex.test( searchTerm )) {
        filterbyEmail = true ;
    }
    if (phoneRegex.test( searchTerm )) {
        filterbyEmail= false;
    }

  
    if (userType === 'matrimony') {
        let query = {};
        if (filterbyEmail ) query = { email: searchTerm.trim() };
        if (!filterbyEmail) query = { "phoneInfo.number": searchTerm.trim() };
        const user = await User.findOne(query)
        .select('-password')
        .limit(20);
        
        if (!user) return res.sendStatus(204);
        return res.status(200).json({
            success: true,
            data: {
              user
              
            }
          });
    }
    
    if (userType === 'video') {
        let query = {};
        if (filterbyEmail ) query = { email: searchTerm.trim() };
        if (!filterbyEmail) query = {  "phone": searchTerm.trim() };
        const user = await VideoProfile.findOne(query)
        .select('-passwordDetails')
        .limit(20);
        
        if (!user) return res.sendStatus(204);
        return res.status(200).json({
            success: true,
            data: {
              user 
            }
          });
    }
    return res.sendStatus(400)
  } catch (error) {
    console.error(error);
        return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
        error: error instanceof Error ? error.message : 'Unknown error'
  });
  }
});

router.put('/users/:id', async function (req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        
    } catch (error) {
        console.error(error);
        
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.put('/users/:id/suspend', async function (req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        await User.findByIdAndUpdate(req.params.id || '' , {'suspension.isSuspended': true });
        return res.sendStatus(200)
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
})

router.put('/users/:id/unsuspend', async function (req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        await User.findByIdAndUpdate(req.params.id || '' , {'suspension.isSuspended': false });
        return res.sendStatus(200)
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});



router.delete('/users/:id', async function (req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        await User.findByIdAndDelete(req.params.id  );
        return res.sendStatus(200)
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
})


router.put('/membership/pricing' ,  async function (req:Request , res : Response , next : NextFunction) :Promise<any> {}) ;
router.get('/membership/request' ,  async function (req:Request , res : Response , next : NextFunction) :Promise<any> {}) ;
router.put('/membership/request/:id/accapt' ,  async function (req:Request , res : Response , next : NextFunction) :Promise<any> {}) ;
router.put('/membership/request/:id/reject' ,  async function (req:Request , res : Response , next : NextFunction) :Promise<any> {}) ;







export default  router;