/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { NextFunction, Request, Response, Router } from "express";
import { giveAuthSessionId } from "../controllers/auth.controller";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { User } from "../models/user";
import VideoProfile from "../models/VideoProfile";
import { number, z } from "zod";
import { MembershipRequest } from "../models/membershipRequest";
import { MembershipRequestStatus } from "../lib/types/memberdship.types";

const router : Router = Router();


router.post('/login', async function (req: Request, res: Response,): Promise<any> {
  try {
    const { email, password } = req.body;

    let adminSettings = JSON.parse(readFileSync(path.join(__dirname , '../../data/admin.panal.settings.json') , 'utf-8'))
   
    let {email: validEmail, password: validPassword} = adminSettings;
    
    if (email === validEmail && password === validPassword) {
        let authToken = giveAuthSessionId();

        writeFileSync(path.join(__dirname , '../../data/admin.panal.settings.json'), JSON.stringify({
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
    console.error(error);
        
    return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
        error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
router.post('/is-loggedin', async function (req: Request, res: Response, ): Promise<any> {
  try {
    const authToken = req.cookies?.admin_auth_token;
    let adminSettings =JSON.parse(readFileSync(path.join(__dirname , '../../data/admin.panal.settings.json') , 'utf-8'))
   
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
    console.error(error);
        
    return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
        error: error instanceof Error ? error.message : 'Unknown error'
    });
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
      
      let adminSettings = JSON.parse(readFileSync(path.join(__dirname , '../../data/admin.panal.settings.json') , 'utf-8'))
   
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
      .select('_id name email profileImage.url suspension onlineStatus membership address phoneInfo');
      
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
        let schema = z.object({
            name : z.string().min(6).max(30).optional(),
            email : z.string().email().optional(),
            phoneInfo:z.object({ number :  z.string().min(8).max(16).regex(/^\d{10,15}$/).optional()}).optional()
        });

        

        let data = schema.parse(req.body);

        await User.findByIdAndUpdate(req.params.id , data)

        return res.sendStatus(200);
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


router.get('/membership/pricing' ,  async function (req:Request , res : Response ) :Promise<any> {
    try {
        let data: any = JSON.parse(readFileSync(path.join(__dirname , '../../data/membership.config.json') , 'utf-8' ));
        return res.status(200).json({
            success : true ,
            data : {
                membership_data : data
            }
        })
    } catch (error) {
        console.error('[/membership/pricing api error]', error);
        return res.status(500).json({
           success: false,
           message: 'Internal server error',
           data: null
        });   
    }
}) ;



router.put('/membership/pricing' ,  async function (req:Request , res : Response ) :Promise<any> {
    try {
          interface PlanPricing {
            price: number;
            sms: number;
          }
          
          interface Plan {
            name: string;
            prices: {
              [durationInMonths: string]: PlanPricing;
            };
          }
          
          interface SubscriptionPlans {
            premium: Plan;
            gold: Plan;
            diamond: Plan;
          }

          let memberships :SubscriptionPlans =  JSON.parse(readFileSync(path.join(__dirname , '../../data/membership.config.json') , 'utf-8'));

          let schema = z.object({
            plan : z.enum(['premium' , 'gold' , 'diamond']), 
            duration : z.enum(['3' , '6'  , '12']), 
            field : z.enum(['sms' , 'price']),
            value : z.number().min(1).max(10000)
          });


        let {plan , duration , field , value} = schema.parse(req.body) ; 

        memberships[plan].prices[duration][field] = value;
        writeFileSync(path.join(__dirname , '../../data/membership.config.json') , JSON.stringify(memberships ));

        return res.sendStatus(200);

    } catch (error) {
        console.error('[/membership/pricing api error]', error);
        return res.status(500).json({
           success: false,
           message: 'Internal server error',
           data: null
        });   
    }
}) ;

router.get('/membership/request', async function (req: Request, res: Response): Promise<any> {
    try {
        // Parse pagination params, default to page 1, limit 10
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 10;
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;

        const skip = (page - 1) * limit;

        const total = await MembershipRequest.countDocuments({requestStatus : MembershipRequestStatus.PENDING});
        const membershipRequests = await MembershipRequest.find({ requestStatus : MembershipRequestStatus.PENDING})
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Membership requests fetched successfully',
            data: {
                requests: membershipRequests,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('[/membership/request api error]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null
        });
    }
});

router.put('/membership/request/:id/accept' ,  async function (req:Request , res : Response ,) :Promise<any> {
    try {
        let {} = (z.object({})).parse(req.body);

        let memberdshipRequest =  await MembershipRequest.findById(req.params.id );
        if (!memberdshipRequest) {
            res.status(400).json({
                success: false,
                message: 'Invalid request parameters', 
                data: null
            });
            return;
        }

        memberdshipRequest.requestStatus = MembershipRequestStatus.APPROVED;
        memberdshipRequest.startDate =new Date()
        memberdshipRequest.endDate =new Date(Date.now() +( memberdshipRequest.duration * 30 *24 *60*60*1000 ));;
        let user = await User.findById(
            memberdshipRequest.requesterID , 
            {
                "membership.currentMembership.requestId" :memberdshipRequest._id ,
               "membership.currentMembership.membership_exipation_date" :memberdshipRequest.endDate 
            }
        );

        await memberdshipRequest.save();
        res.status(200);


    } catch (error) {
        console.error('[/membership/pricing api error]', error);
        return res.status(500).json({
           success: false,
           message: 'Internal server error',
           data: null
        }); 
    }
});

router.put('/membership/request/:id/reject' ,  async function (req:Request , res : Response ,) :Promise<any> {
    try {
        let {reason} = (z.object({
            reason : z.string().min(1).max(120)
        })).parse(req.body);

        let m =await MembershipRequest.findByIdAndUpdate(req.params.id , {
            requestStatus : MembershipRequestStatus.REJECTED ,
            adminNote : reason
        });
        res.status(200).json({
            success : true,
            data : {
        
            },
            error : null,
            message : 'OK'
        })
        return;
    } catch (error) {
        console.error('[/membership/pricing api error]', error);
        return res.status(500).json({
           success: false,
           message: 'Internal server error',
           data: null
        }); 
    }
});


router.post('/notification' , async function (req:Request , res : Response ,) :Promise<any> {
    try {
        let {type , title , body} = (z.object({
            type : z.enum(['global' ,'video' , 'matrimony' , ]),
            title : z.string().max(80),
            body : z.string().max(120)
        })).parse(req.body);

        res.status(200).json({
            success : true,
            data : {
        
            },
            error : null,
            message : 'OK'
        })
        return;
    
    } catch (error) {
        console.error('[notification admin error]', error);
        return res.status(500).json({
           success: false,
           message: 'Internal server error',
           data: null
        });
    } 
} )



export default  router;