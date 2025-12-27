import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { browserToPdfCoords, pdfToBrowserCoords } from '../utils/coordinateConverter';
import PDFField from './PDFField';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker for Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const PDFViewer = ({ pdfUrl, fields, onFieldAdd, onFieldUpdate, onFieldDelete, selectedFieldId, onFieldSelect }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [pdfPageDimensions, setPdfPageDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = (page) => {
    const viewport = page.getViewport({ scale: 1.0 });
    setPdfPageDimensions({
      width: viewport.width,
      height: viewport.height,
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData('fieldType');
    if (!fieldType) return;

    // Get the PDF page element position
    const containerRect = containerRef.current.getBoundingClientRect();
    const pageElement = containerRef.current.querySelector('.react-pdf__Page');
    
    if (!pageElement) return;
    
    const pageRect = pageElement.getBoundingClientRect();
    
    // Calculate position relative to the PDF page (not the container)
    const x = (e.clientX - pageRect.left) / scale;
    const y = (e.clientY - pageRect.top) / scale;

    // Default field dimensions
    const defaultDimensions = {
      text: { width: 200, height: 40 },
      signature: { width: 200, height: 80 },
      image: { width: 150, height: 150 },
      date: { width: 150, height: 40 },
      radio: { width: 30, height: 30 },
    };

    const dimensions = defaultDimensions[fieldType] || { width: 100, height: 40 };

    const newField = {
      id: Date.now().toString(),
      type: fieldType,
      x: x - dimensions.width / 2,
      y: y - dimensions.height / 2,
      width: dimensions.width,
      height: dimensions.height,
      value: '',
      page: pageNumber,
    };

    onFieldAdd(newField);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getFieldsForCurrentPage = () => {
    return fields.filter((field) => field.page === pageNumber);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
            disabled={pageNumber <= 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {pageNumber} of {numPages || 0}
          </span>
          <button
            onClick={() => setPageNumber((prev) => Math.min(numPages || 1, prev + 1))}
            disabled={pageNumber >= (numPages || 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScale((prev) => Math.max(0.5, prev - 0.25))}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            -
          </button>
          <span className="text-gray-700">{(scale * 100).toFixed(0)}%</span>
          <button
            onClick={() => setScale((prev) => Math.min(2.0, prev + 0.25))}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-200 p-8 flex justify-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => onFieldSelect(null)}
      >
        <div className="bg-white shadow-lg" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="p-8">Loading PDF...</div>}
            error={<div className="p-8 text-red-500">Error loading PDF</div>}
          >
            <div className="relative" style={{ width: pdfPageDimensions.width || 'auto', height: pdfPageDimensions.height || 'auto' }}>
              <Page
                ref={pageRef}
                pageNumber={pageNumber}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              {pdfPageDimensions.height > 0 && getFieldsForCurrentPage().map((field) => (
                <PDFField
                  key={field.id}
                  field={field}
                  scale={scale}
                  pdfHeight={pdfPageDimensions.height}
                  containerHeight={pdfPageDimensions.height}
                  onUpdate={onFieldUpdate}
                  onDelete={onFieldDelete}
                  onSelect={onFieldSelect}
                  isSelected={selectedFieldId === field.id}
                />
              ))}
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;

