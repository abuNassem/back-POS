// functions.js

export const validateNumber = (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0 ? num : null; // تعديل ليدعم الصفر كقيمة صالحة
};

export const isEmpty = (value) => {
    return value === undefined || value === null || value.toString().trim() === '';
};

export const isNumber = (value) => {
    return typeof value === "number" && !isNaN(value);
};

// دالة النجاح الموحدة
export const sendSuccess = (res, data, message = "تمت العملية بنجاح", status = 200) => {
    return res.status(status).json({
        status: "success",
        message,
        data
    });
};

// دالة الخطأ الموحدة (جديدة)
export const sendError = (res, errorCode, message, status = 400) => {
    return res.status(status).json({
        status: "fail",
        errorCode,
        message
    });
};

/**
 * دالة للتحقق من وجود السجل في قاعدة البيانات
 * تقلل تكرار كود check if exists
 */
export const checkEntity = (res, entity, entityName = "السجل") => {
    if (!entity) {
        sendError(res, "NOT_FOUND", `${entityName} غير موجود`, 404);
        return false;
    }
    return true;
};