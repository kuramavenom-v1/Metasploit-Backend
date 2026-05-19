const express = require('express');
const app = express();

// تشغيل مجلد الواجهة والملفات الثابتة
app.use(express.static('public'));

// هنا كود السيرفر الأساسي الخاص بك (يتم قراءته تلقائياً)
// ...

module.exports = app;
