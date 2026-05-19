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

// المسار الرئيسي لتشغيل واجهة الأداة المتوهجة مباشرة
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// مسارات الـ API الخاصة بالأداة (لو كنت تستدعي مسار معين)
app.get('/api/status', (req, res) => {
    res.json({ status: "running", tool: "Metasploit Framework Guide" });
});

module.exports = app;
