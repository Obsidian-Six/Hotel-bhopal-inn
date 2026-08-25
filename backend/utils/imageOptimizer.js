const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Automatically optimizes an uploaded image file on disk.
 * Resizes max-width to 1920px and compresses to WebP or JPEG.
 */
async function optimizeImage(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return filePath;
    const ext = path.extname(filePath).toLowerCase();
    
    // Only process images
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        return filePath;
    }

    try {
        const tempPath = filePath + '.tmp' + ext;
        const metadata = await sharp(filePath).metadata();
        
        let pipeline = sharp(filePath);
        
        // Resize if width > 1920px
        if (metadata.width && metadata.width > 1920) {
            pipeline = pipeline.resize({ width: 1920, fit: 'inside', withoutEnlargement: true });
        }

        // Compress
        if (ext === '.png') {
            await pipeline.png({ quality: 82, compressionLevel: 8 }).toFile(tempPath);
        } else if (ext === '.webp') {
            await pipeline.webp({ quality: 82 }).toFile(tempPath);
        } else {
            await pipeline.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(tempPath);
        }

        // Overwrite original file if temp file is smaller
        const origSize = fs.statSync(filePath).size;
        const tempSize = fs.statSync(tempPath).size;

        if (tempSize < origSize) {
            fs.unlinkSync(filePath);
            fs.renameSync(tempPath, filePath);
            console.log(`Auto-optimized upload ${path.basename(filePath)}: ${(origSize/1024).toFixed(1)}KB -> ${(tempSize/1024).toFixed(1)}KB`);
        } else {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    } catch (err) {
        console.error('Image optimization warning:', err.message);
    }
    return filePath;
}

module.exports = { optimizeImage };
