import jwt from 'jsonwebtoken'
import { sendError } from '../product/functions.js'
export const checkAuth=(req,res,next)=>{
    const token=req.token.jwt
    console.log('token........')
    if(!token){
                console.log('error')

         sendError(res,"لم يسجل  دخول","غير مصرح له")
        return next()
    }
    jwt.verify( token,process.env.JWT_SECRET,(error,decoded)=>{
        console.log('loading')
        if(error){
            next( sendError(res,"invalid token","غير مصرح له"))
        }
        req.user=decoded
        return next()
    })
    
}