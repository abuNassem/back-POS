import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true }, // التغيير هنا
    password: { type: String, required: true },
    birthDate: { type: Date, required: true },
    documentId: { type: String, required: true} // سيتم تشفيره
}, {
    timestamps: true,
});

// تشفير كلمة المرور ورقم الوثيقة قبل الحفظ
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') && !this.isModified('documentId')) {
        next();
    }
    
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // تشفير رقم الوثيقة للحماية
    if (this.isModified('documentId')) {
        const salt = await bcrypt.genSalt(10);
        this.documentId = await bcrypt.hash(this.documentId, salt);
    }
});

// دالة لمقارنة كلمة المرور
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;