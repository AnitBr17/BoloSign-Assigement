# PDF Signature Injection Engine

A full-stack application for injecting signatures and form fields into PDF documents with coordinate conversion between browser (CSS pixels) and PDF (points) coordinate systems.

## Features

- **Frontend (React + Vite)**
  - PDF viewer with drag & drop field placement
  - Support for multiple field types: Text, Signature, Image, Date, Radio
  - Resizable and draggable fields
  - Responsive design that maintains field positions across screen sizes
  - Coordinate conversion between browser and PDF coordinate systems

- **Backend (Node.js + Express)**
  - PDF signing endpoint that overlays fields onto PDFs
  - Aspect ratio preservation for images
  - SHA-256 hash calculation for audit trail
  - MongoDB integration for storing document history

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the Backend directory:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/bolosign
```

4. Start MongoDB (if running locally):
```bash
# On Windows (if MongoDB is installed as a service, it should start automatically)
# On macOS/Linux:
mongod
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

## Usage

1. **Open the application** in your browser (usually `http://localhost:5173`)

2. **Load a PDF**: The app will load a sample PDF by default. You can modify the PDF URL in `Frontend/src/App.jsx`

3. **Add Fields**:
   - Drag fields from the left palette onto the PDF
   - Fields can be dragged and resized
   - Double-click text/date fields to edit
   - Click signature fields to draw a signature
   - Click image fields to upload an image

4. **Sign the PDF**:
   - Click the "Sign PDF" button in the header
   - The backend will process the PDF and return a signed version
   - The signed PDF will open in a new tab

## Field Types

- **Text Box**: Double-click to edit text
- **Signature**: Click to open signature drawing modal
- **Image**: Click to upload an image file
- **Date**: Double-click to select a date
- **Radio**: Click to toggle on/off

## API Endpoints

### POST /api/sign-pdf
Signs a PDF with the provided fields.

**Request Body:**
```json
{
  "pdfUrl": "https://example.com/sample.pdf",
  "fields": [
    {
      "id": "123",
      "type": "signature",
      "x": 100,
      "y": 200,
      "width": 200,
      "height": 80,
      "value": "data:image/png;base64,...",
      "page": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "signedPdfUrl": "http://localhost:3001/uploads/signed_1234567890.pdf",
  "originalHash": "abc123...",
  "signedHash": "def456...",
  "auditTrailId": "507f1f77bcf86cd799439011"
}
```

### GET /api/audit-trail/:id
Retrieves audit trail information for a signed PDF.

### GET /api/health
Health check endpoint.

## Coordinate System

The application handles coordinate conversion between:
- **Browser coordinates**: CSS pixels, origin at top-left
- **PDF coordinates**: Points (72 DPI), origin at bottom-left

Fields are positioned relative to the PDF page and maintain their position when the viewport size changes.

## Project Structure

```
.
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FieldPalette.jsx
│   │   │   ├── PDFField.jsx
│   │   │   ├── PDFViewer.jsx
│   │   │   └── SignatureModal.jsx
│   │   ├── utils/
│   │   │   └── coordinateConverter.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── Backend/
│   ├── server.js
│   ├── uploads/ (created automatically)
│   └── package.json
└── README.md
```

## Technologies Used

**Frontend:**
- React 19
- Vite
- TailwindCSS
- react-pdf (PDF.js)
- react-draggable
- react-resizable

**Backend:**
- Node.js
- Express
- pdf-lib
- MongoDB (Mongoose)
- crypto (for SHA-256 hashing)

## Notes

- The sample PDF URL can be changed in `Frontend/src/App.jsx`
- Signed PDFs are stored in `Backend/uploads/`
- Audit trails are stored in MongoDB
- Image aspect ratios are preserved when overlaying on PDFs
- The coordinate system automatically handles responsive layouts

## Troubleshooting

1. **PDF not loading**: Check the PDF URL and ensure CORS is enabled if loading from external source
2. **MongoDB connection error**: Ensure MongoDB is running and the connection string in `.env` is correct
3. **Worker errors**: The PDF.js worker is configured for Vite. If issues persist, check the browser console
4. **Fields not appearing**: Ensure fields are dropped on the PDF page area, not outside it

## License

ISC
