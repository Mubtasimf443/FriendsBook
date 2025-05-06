/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */

import { writeFileSync } from "fs";
// import Awaiter from "./lib/core/Awaiter";
import { EducationLevel } from "./lib/types/userEducation.types";
import Awaiter from "./lib/core/Awaiter";



let array = require('../profile-data.json');

async function main() {
    for (let i = 0; i < array.length; i++) {
        const element = array[i];
        createUserSycn(element , i +1 );

        if (i %10 === 0) await Awaiter(250)
    }

    // let data = Object.values(EducationLevel);
    // writeFileSync('data.json' , JSON.stringify(data))
};
main();


// async function createUser(element : any) {
//     let {   success , error ,data , message } = (
//         await
//             (
//                 await fetch('http://localhost:4000/api/auth/create-registration-session', {
//                     headers: {
//                         'Content-Type': 'application/json'
//                     },
//                     method: 'POST',
//                     body: JSON.stringify(element)
//                 }))
//                 .json()
//     );
   

//     await fetch('http://localhost:4000/api/auth/verify-registration-otp', {
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({  sessionKey : data.sessionKey  , otp: '123456' }),
//         method :'POST'
//     });

//     console.log("User Created SuccessFully");
    
// }

function createUserSycn(element:any , num : any) {
    fetch('http://localhost:4000/api/auth/create-registration-session', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(element)
    })
    .then(data => data.json())
    .then(({   success , error ,data , message }) => {
        if (!success) {
            return console.error(message); 
        }
        fetch('http://localhost:4000/api/auth/request-registration-otp', {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionKey : data.sessionKey }),
            method :'POST'
        })
        .then(function () {
            fetch('http://localhost:4000/api/auth/verify-registration-otp', {
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({  sessionKey : data.sessionKey  , otp: '123456' }),
                method :'POST'
            }) 
            .then(() =>console.log("User Created " + num) )     
        })

    })
  


}