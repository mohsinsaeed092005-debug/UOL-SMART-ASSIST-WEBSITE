const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const voucherUploadDir = path.join(__dirname, 'uploads', 'vouchers');

fs.mkdirSync(voucherUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, voucherUploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-z0-9.-]/gi, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mock student data
const student = {
  name: 'Ali',
  email: 'ali@uol.edu.pk',
  password: '12345',
  scholarship: 20,
  hostelDue: 2,
};

const registeredStudents = [];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email === student.email && password === student.password) {
    return res.json({ success: true, student: { name: student.name, email: student.email } });
  }

  const registeredStudent = registeredStudents.find(
    account => account.email === email && account.password === password,
  );

  if (registeredStudent) {
    return res.json({
      success: true,
      student: { name: registeredStudent.name, email: registeredStudent.email },
    });
  }

  res.json({ success: false });
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const alreadyExists = registeredStudents.some(account => account.email === email);
  if (alreadyExists || email === student.email) {
    return res.status(409).json({ success: false, message: 'This email is already registered.' });
  }

  registeredStudents.push({ name, email, password });
  res.json({ success: true, student: { name, email } });
});

app.get('/api/scholarship', (req, res) => {
  res.json({
    message: 'No scholarship data available yet from the university.',
  });
});

app.get('/api/fee', (req, res) => {
  res.json({
    message: 'No fee voucher data available yet from the university.',
  });
});

app.get('/api/download-voucher', (req, res) => {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, 'voucher.pdf');
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  doc.fontSize(20).text('University of Lahore', { align: 'center' });
  doc.text('Fee Voucher', { align: 'center' });

  doc.moveDown();
  doc.text('Student: Ali');
  doc.text('Scholarship: 20%');
  doc.text('Fee: 50,000 PKR');

  doc.end();

  stream.on('finish', () => {
    res.download(filePath);
  });
});

app.post('/api/upload-voucher', upload.single('voucher'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'No voucher file uploaded.',
    });
  }

  res.json({
    message: `Voucher "${req.file.originalname}" analyzed. Status: Approved. No errors detected.`,
    file: `/uploads/vouchers/${req.file.filename}`,
  });
});

app.get('/api/hostel', (req, res) => {
  res.json({
    message: 'No hostel data available yet from the university.',
  });
});

app.get('/api/admit', (req, res) => {
  res.json({
    message: 'No admit card data available yet from the university.',
  });
});

app.post('/api/ai', (req, res) => {
  const msg = (req.body.message || '').toLowerCase();

  if (!msg.trim()) {
    return res.json({ reply: 'Please enter your issue first.' });
  }

  let reply = "I didn't understand.";

  if (msg.includes('scholarship')) {
    reply = 'No scholarship data is available yet from the university.';
  } else if (msg.includes('voucher')) {
    reply = 'No official voucher data is available yet from the university.';
  } else if (msg.includes('hostel')) {
    reply = 'No hostel data is available yet from the university.';
  } else if (msg.includes('urgent')) {
    reply = 'Your urgent request has been noted. Please contact the admin office for manual support.';
  }

  res.json({ reply });
});

app.listen(PORT, () => {
  console.log(`UOL SmartAssist is running at http://localhost:${PORT}`);
});
