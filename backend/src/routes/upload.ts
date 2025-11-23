import { Router } from 'express';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const uploadDir = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Get list of uploaded images
router.get('/list', authMiddleware, async (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(uploadDir);
    
    // Filter for image files only
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Get file stats for each image
    const images = imageFiles.map(filename => {
      const filepath = path.join(uploadDir, filename);
      const stats = fs.statSync(filepath);
      
      return {
        filename,
        url: `/uploads/${filename}`,
        size: stats.size,
        uploadedAt: stats.mtime,
      };
    });

    // Sort by upload date, newest first
    images.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    return res.status(200).json({ images });
  } catch (error) {
    console.error('Error listing uploads:', error);
    return res.status(500).json({ error: 'Error listing uploads' });
  }
});

// Upload new image
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error uploading file' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = path.basename(file.filepath);
    const url = `/uploads/${filename}`;

    return res.status(200).json({ url });
  });
});

// Delete uploaded image
router.delete('/:filename', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Security check: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join(uploadDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file
    fs.unlinkSync(filepath);
    
    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: 'Error deleting file' });
  }
});

export default router;

