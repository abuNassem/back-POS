import asyncHandler from 'express-async-handler';

import { clearToken, generateToken } from './helper.js';
import User from './User.js';

import {
   sendError,
   sendSuccess,
   isEmpty,
} from '../product/functions.js';


// ================= REGISTER =================
export const registerUser = asyncHandler(async (req, res) => {

   const {
      name,
      phone,
      password,
      birthDate,
      documentId
   } = req.body;


   // ===== VALIDATION =====
   if (
      isEmpty(name) ||
      isEmpty(phone) ||
      isEmpty(password)||
            isEmpty(documentId)

   ) {

      return sendError(
         res,
         "EMPTY_FIELDS",
         "جميع الحقول المطلوبة يجب تعبئتها"
      );
   }


   // ===== CHECK USER =====
   const userExists = await User.findOne({ phone });

   if (userExists) {

      return sendError(
         res,
         "USER_ALREADY_EXISTS",
         "المستخدم موجود مسبقاً"
      );
   }


   // ===== CREATE USER =====
   const user = await User.create({
      name,
      phone,
      password,
      birthDate,
      documentId,
   });


   // ===== FAILED =====
   if (!user) {

      return sendError(
         res,
         "INVALID_USER_DATA",
         "بيانات المستخدم غير صالحة"
      );
   }


   // ===== TOKEN =====
   generateToken(
      res,
      user._id,
      user.documentId
   );


   // ===== SUCCESS =====
   return sendSuccess(
      res,
      {
         _id: user._id,
         name: user.name,
         phone: user.phone,
      },
      "تم إنشاء الحساب بنجاح",
      201
   );

});


// ================= LOGIN =================
export const authUser = asyncHandler(async (req, res) => {

   const {
      phone,
      password
   } = req.body;


   // ===== VALIDATION =====
   if (
      isEmpty(phone) ||
      isEmpty(password)
   ) {

      return sendError(
         res,
         "EMPTY_FIELDS",
         "رقم الهاتف وكلمة المرور مطلوبان"
      );
   }


   // ===== FIND USER =====
   const user = await User.findOne({ phone });


   // ===== CHECK PASSWORD =====
   if (
      !user ||
      !(await user.matchPassword(password))
   ) {

      return sendError(
         res,
         "INVALID_CREDENTIALS",
         "رقم الهاتف أو كلمة المرور غير صحيحة",
         401
      );
   }


   // ===== TOKEN =====
   generateToken(
      res,
      user._id,
      user.documentId
   );


   // ===== SUCCESS =====
   return sendSuccess(
      res,
      {
         _id: user._id,
         name: user.name,
         phone: user.phone,
      },
      "تم تسجيل الدخول بنجاح"
   );

});


// ================= LOGOUT =================
export const logoutUser = asyncHandler(async (req, res) => {

   clearToken(res);


   return sendSuccess(
      res,
      null,
      "تم تسجيل الخروج بنجاح"
   );

});