/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { IVideoProfile } from "../../models/VideoProfile";
import { IUser } from "./user.types";


declare module 'socket.io' {
    interface Socket {
      user?: IUser | IVideoProfile |any;
      userProfileType?: "videoProfile" | "matrimonyProfile";
    }
  }
  