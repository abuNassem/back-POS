import express from 'express'
import { getPublicInfo, getRepositryInfo, getTopSellingProducts } from './overViewControlar.js'

const router=express.Router()

router.get('/public',getPublicInfo)

router.get('/repositry',getRepositryInfo)

router.get('/topSaling',getTopSellingProducts)


export default router