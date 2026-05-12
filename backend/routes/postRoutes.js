const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/posts/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'post-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// @route   GET /api/posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/posts
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const post = new Post({
            image: `/uploads/posts/${req.file.filename}`,
            caption: req.body.caption
        });
        await post.save();
        res.status(201).json(post);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/posts/:id
router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.image && fs.existsSync(path.join(__dirname, '..', post.image))) {
            fs.unlinkSync(path.join(__dirname, '..', post.image));
        }
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
