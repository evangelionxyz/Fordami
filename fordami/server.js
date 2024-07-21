const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/upload', upload.single('image'), (req, res) => {
    try {
        res.status(200).send({ filePath: `/uploads/${req.file.filename}` });
    } catch (error) {
        res.status(500).send({ error: 'Failed to upload image' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
