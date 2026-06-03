import jwt from 'jsonwebtoken';

/**
 * إنشاء توكن JWT وتخزينه في كوكيز الاستجابة
 * @param {Object} res - كائن الاستجابة من Express
 * @param {String} userId - معرف المستخدم من قاعدة البيانات
 * @param {String} documentId - رقم الوثيقة (المشفر)
 */
export const generateToken = (res, userId, documentId) => {
    // إنشاء التوكن مع البيانات المطلوبة
    const token = jwt.sign(
        { userId, documentId }, 
        process.env.JWT_SECRET, 
        { expiresIn: '30d' }
    );

    // إعداد الكوكيز
    res.cookie('jwt', token, {
        httpOnly: true, // حماية ضد هجمات XSS (لا يمكن الوصول إليه عبر JS)
        secure: process.env.NODE_ENV !== 'development', // يعمل فقط عبر HTTPS في الإنتاج
        sameSite: 'Lax', // حماية ضد هجمات CSRF
        maxAge: 30 * 24 * 60 * 60 * 1000, // صالح لمدة 30 يوم
    });

    return token;
};

/**
 * مسح توكن JWT من الكوكيز عند تسجيل الخروج
 */
export const clearToken = (res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
};