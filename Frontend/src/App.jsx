import React, { useState } from 'react';
import PDFViewer from './components/PDFViewer';
import FieldPalette from './components/FieldPalette';
import SignatureModal from './components/SignatureModal';
import './App.css';

function App() {
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [signatureModal, setSignatureModal] = useState({ isOpen: false, fieldId: null });
  // Use a sample PDF URL - you can replace this with your own PDF
  const [pdfUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

  const handleFieldAdd = (newField) => {
    setFields([...fields, newField]);
  };

  const handleFieldUpdate = (updatedField) => {
    setFields(fields.map((f) => (f.id === updatedField.id ? updatedField : f)));
  };

  const handleFieldDelete = (fieldId) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleFieldSelect = (fieldId) => {
    setSelectedFieldId(fieldId);
    const field = fields.find((f) => f.id === fieldId);
    if (field && field.type === 'signature' && !field.value) {
      setSignatureModal({ isOpen: true, fieldId });
    }
  };

  const handleSignatureSave = (fieldId, signatureDataUrl) => {
    handleFieldUpdate({
      ...fields.find((f) => f.id === fieldId),
      value: signatureDataUrl,
    });
  };

  const handleImageUpload = (fieldId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      handleFieldUpdate({
        ...fields.find((f) => f.id === fieldId),
        value: e.target.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSignPDF = async () => {
    if (fields.length === 0) {
      alert('Please add at least one field to the PDF');
      return;
    }

    // Collect all field data with PDF coordinates
    // Convert from CSS pixels to PDF points
    // PDF uses 72 DPI, browsers typically use 96 DPI
    const fieldData = fields.map((field) => {
      // Convert CSS pixels to PDF points
      // The coordinates from the drag/drop are in CSS pixels relative to the PDF page
      // We need to convert to PDF points (72 points per inch vs 96 pixels per inch)
      const pointsPerPixel = 72 / 96;
      
      return {
        id: field.id,
        type: field.type,
        x: field.x * pointsPerPixel,
        y: field.y * pointsPerPixel, // Will be converted to bottom-left in backend
        width: field.width * pointsPerPixel,
        height: field.height * pointsPerPixel,
        value: field.value,
        page: field.page,
      };
    });

    try {
      const response = await fetch('http://localhost:3001/api/sign-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfUrl: pdfUrl,
          fields: fieldData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        window.open(result.signedPdfUrl, '_blank');
        alert('PDF signed successfully!');
      } else {
        alert('Error signing PDF');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error signing PDF: ' + error.message);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">PDF Signature Injection Engine</h1>
          <button
            onClick={handleSignPDF}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold"
          >
            Sign PDF
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <FieldPalette onFieldSelect={(type) => console.log('Selected:', type)} />
        <PDFViewer
          pdfUrl={pdfUrl}
          fields={fields}
          onFieldAdd={handleFieldAdd}
          onFieldUpdate={handleFieldUpdate}
          onFieldDelete={handleFieldDelete}
          selectedFieldId={selectedFieldId}
          onFieldSelect={handleFieldSelect}
        />
      </div>

      <SignatureModal
        isOpen={signatureModal.isOpen}
        onClose={() => setSignatureModal({ isOpen: false, fieldId: null })}
        onSave={handleSignatureSave}
        fieldId={signatureModal.fieldId}
      />
    </div>
  );
}

export default App;
