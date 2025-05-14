import { connect } from "http2";
import { connectDB } from "./config/connectDB";
import { User } from "./models/user";
import VideoProfile from "./models/VideoProfile";

async function main() {
    await connectDB();
    let user = await VideoProfile.findOne({
        "auth.authSession" : '9bdbd30a423ed40fd2a318a2f9148cb6dcee67050b3ee698e7f64e3e5f5ba8e8' , 
         "auth.session_exp_date": { $gt :new Date() }
    });

    console.log(user);
}
main()