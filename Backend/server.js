const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { PDFDocument, rgb } = require('pdf-lib');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bolosign', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Audit Trail Schema
const auditTrailSchema = new mongoose.Schema({
  pdfId: String,
  originalHash: String,
  signedHash: String,
  signedPdfUrl: String,
  fields: [{
    type: String,
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    value: String,
    page: Number,
  }],
  createdAt: { type: Date, default: Date.now },
});

const AuditTrail = mongoose.model('AuditTrail', auditTrailSchema);

// Helper function to calculate SHA-256 hash
const calculateHash = async (pdfBytes) => {
  return crypto.createHash('sha256').update(pdfBytes).digest('hex');
};

// Helper function to download PDF from URL or read from file
const getPdfBytes = async (pdfUrl) => {
  if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
    return new Promise((resolve, reject) => {
      const client = pdfUrl.startsWith('https://') ? https : http;
      client.get(pdfUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch PDF: ${response.statusCode}`));
          return;
        }
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  } else {
    // Assume it's a local file path
    const filePath = path.join(__dirname, '..', 'Frontend', 'public', pdfUrl);
    return await fs.readFile(filePath);
  }
};

// Helper function to embed image with aspect ratio preservation
const embedImageWithAspectRatio = async (pdfDoc, imageBytes, x, y, width, height, imageType = 'png') => {
  let image;
  if (imageType === 'png') {
    image = await pdfDoc.embedPng(imageBytes);
  } else {
    image = await pdfDoc.embedJpg(imageBytes);
  }

  const imageDims = image.scale(1);
  const imageAspectRatio = imageDims.width / imageDims.height;
  const boxAspectRatio = width / height;

  let finalWidth, finalHeight, offsetX = 0, offsetY = 0;

  if (imageAspectRatio > boxAspectRatio) {
    // Image is wider - fit to width
    finalWidth = width;
    finalHeight = width / imageAspectRatio;
    offsetY = (height - finalHeight) / 2; // Center vertically
  } else {
    // Image is taller - fit to height
    finalHeight = height;
    finalWidth = height * imageAspectRatio;
    offsetX = (width - finalWidth) / 2; // Center horizontally
  }

  return {
    image,
    x: x + offsetX,
    y: y + offsetY,
    width: finalWidth,
    height: finalHeight,
  };
};

// POST /api/sign-pdf endpoint
app.post('/api/sign-pdf', async (req, res) => {
  try {
    const { pdfUrl, fields } = req.body;

    if (!pdfUrl || !fields) {
      return res.status(400).json({ error: 'Missing pdfUrl or fields' });
    }

    // Load the original PDF
    const pdfBytes = await getPdfBytes(pdfUrl);
    const originalHash = await calculateHash(pdfBytes);

    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // Process each field
    for (const field of fields) {
      const page = pages[field.page - 1];
      if (!page) continue;

      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Convert coordinates if needed (PDF coordinates are from bottom-left)
      const x = field.x;
      const y = pageHeight - field.y - field.height; // Convert from top-left to bottom-left

      switch (field.type) {
        case 'text':
          if (field.value) {
            page.drawText(field.value, {
              x: x,
              y: y + field.height - 10, // Adjust for text baseline
              size: 12,
              color: rgb(0, 0, 0),
            });
          }
          break;

        case 'signature':
        case 'image':
          if (field.value) {
            try {
              // Extract base64 data
              const base64Data = field.value.replace(/^data:image\/\w+;base64,/, '');
              const imageBytes = Buffer.from(base64Data, 'base64');

              // Determine image type
              const imageType = field.value.startsWith('data:image/png') ? 'png' : 'jpg';

              // Embed image with aspect ratio preservation
              const imageData = await embedImageWithAspectRatio(
                pdfDoc,
                imageBytes,
                x,
                y,
                field.width,
                field.height,
                imageType
              );

              page.drawImage(imageData.image, {
                x: imageData.x,
                y: imageData.y,
                width: imageData.width,
                height: imageData.height,
              });
            } catch (error) {
              console.error('Error embedding image:', error);
            }
          }
          break;

        case 'date':
          if (field.value) {
            page.drawText(field.value, {
              x: x,
              y: y + field.height - 10,
              size: 12,
              color: rgb(0, 0, 0),
            });
          }
          break;

        case 'radio':
          if (field.value) {
            // Draw a filled circle
            page.drawCircle({
              x: x + field.width / 2,
              y: y + field.height / 2,
              size: Math.min(field.width, field.height) / 3,
              color: rgb(0, 0, 0),
            });
          }
          break;
      }
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const signedHash = await calculateHash(modifiedPdfBytes);

    // Save signed PDF to disk
    const outputDir = path.join(__dirname, 'uploads');
    await fs.mkdir(outputDir, { recursive: true });
    const filename = `signed_${Date.now()}.pdf`;
    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, modifiedPdfBytes);

    const signedPdfUrl = `http://localhost:${PORT}/uploads/${filename}`;

    // Store audit trail
    const auditTrail = new AuditTrail({
      pdfId: pdfUrl,
      originalHash,
      signedHash,
      signedPdfUrl,
      fields,
    });
    await auditTrail.save();

    res.json({
      success: true,
      signedPdfUrl,
      originalHash,
      signedHash,
      auditTrailId: auditTrail._id,
    });
  } catch (error) {
    console.error('Error signing PDF:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// GET /api/audit-trail/:id - Get audit trail
app.get('/api/audit-trail/:id', async (req, res) => {
  try {
    const auditTrail = await AuditTrail.findById(req.params.id);
    if (!auditTrail) {
      return res.status(404).json({ error: 'Audit trail not found' });
    }
    res.json(auditTrail);
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

