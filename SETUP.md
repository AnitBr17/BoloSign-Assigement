# Quick Setup Guide

## Prerequisites Check

1. **Node.js**: Run `node --version` (should be v16+)
2. **MongoDB**: Ensure MongoDB is installed and running
   - Windows: Usually runs as a service automatically
   - Mac/Linux: Run `mongod` in terminal

## Step-by-Step Setup

### 1. Backend Setup

```bash
cd Backend
npm install
```

Create `.env` file in `Backend/` folder:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/bolosign
```

Start backend:
```bash
npm run dev
```

You should see: `Server running on http://localhost:3001`

### 2. Frontend Setup

Open a new terminal:

```bash
cd Frontend
npm install
npm run dev
```

You should see: `Local: http://localhost:5173`

### 3. Test the Application

1. Open `http://localhost:5173` in your browser
2. Wait for the PDF to load
3. Drag a field from the left palette onto the PDF
4. Try different field types:
   - **Text**: Double-click to edit
   - **Signature**: Click to draw
   - **Image**: Click to upload
   - **Date**: Double-click to select date
   - **Radio**: Click to toggle
5. Click "Sign PDF" button to generate the signed PDF

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or check Windows services
- Verify connection string in `.env` file

### PDF Not Loading
- Check browser console for errors
- Try a different PDF URL in `Frontend/src/App.jsx`

### Port Already in Use
- Backend: Change `PORT` in `.env` file
- Frontend: Vite will automatically use next available port

### Module Not Found Errors
- Run `npm install` again in both Frontend and Backend folders
- Delete `node_modules` and `package-lock.json`, then `npm install`

## Next Steps

- Add your own PDF by placing it in `Frontend/public/` and updating the URL in `App.jsx`
- Customize field types and styling
- Add authentication if needed
- Deploy to production

