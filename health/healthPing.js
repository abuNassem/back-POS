
export const health=(res,req)=>{
    try{

       return req.status(200).json({ping:true,message:'successfully'})
    }catch(err){
               return req.status(200).json({ping:false,message:'failed'})
    }
}