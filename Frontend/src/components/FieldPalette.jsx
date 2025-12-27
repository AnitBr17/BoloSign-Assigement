import React from 'react';

const FieldPalette = ({ onFieldSelect }) => {
  const fieldTypes = [
    { type: 'text', label: 'Text Box', icon: '📝' },
    { type: 'signature', label: 'Signature', icon: '✍️' },
    { type: 'image', label: 'Image', icon: '🖼️' },
    { type: 'date', label: 'Date', icon: '📅' },
    { type: 'radio', label: 'Radio', icon: '🔘' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg p-4 border-r border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Fields</h2>
      <p className="text-sm text-gray-600 mb-4">Drag fields onto the PDF</p>
      <div className="space-y-2">
        {fieldTypes.map((field) => (
          <div
            key={field.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('fieldType', field.type);
              onFieldSelect(field.type);
            }}
            className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 cursor-move rounded-lg border border-blue-200 transition-colors"
          >
            <span className="text-2xl">{field.icon}</span>
            <span className="font-medium text-gray-700">{field.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldPalette;

