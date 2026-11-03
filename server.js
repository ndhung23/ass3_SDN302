const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const classRoutes = require('./routes/classRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

app.use(express.json());

connectDB();

app.get('/', async (req, res) => {
    try {
        res.send({ message: 'Welcome to Practical Exam!' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/', studentRoutes);
app.use('/api/', subjectRoutes);
app.use('/api/', classRoutes);
app.use('/api/', attendanceRoutes);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
