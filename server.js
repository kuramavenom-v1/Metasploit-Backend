const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors()); // للسماح لموقع جيت هاب بيجز بالاتصال بالسيرفر

// كلمة المرور المحددة من قبلك
const CORRECT_PASSWORD = "Komva - v1";

// مسار فحص تسجيل الدخول
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const timestamp = new Date().toISOString();
    let loginStatus = "FAILED";

    if (password === CORRECT_PASSWORD) {
        loginStatus = "SUCCESS";
    }

    // صياغة السجل لحفظه
    const logEntry = `[${timestamp}] Email: ${email} | Status: ${loginStatus} | IP: ${req.ip}\n`;

    // كتابة المحاولة في ملف السجلات على السيرفر
    fs.appendFile('login_attempts.log', logEntry, (err) => {
        if (err) console.error("خطأ في تسجيل المحاولة المحفوظة:", err);
    });

    if (loginStatus === "SUCCESS") {
        return res.json({ success: true, message: "تم التحقق والدخول بنجاح" });
    } else {
        return res.status(401).json({ success: false, message: "بيانات الاعتماد غير صحيحة" });
    }
});

// تشغيل السيرفر على المنفذ الذي تحدده منصة Render تلقائياً
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`سيرفر الباك اند يعمل بنجاح على منفذ: ${PORT}`);
});
