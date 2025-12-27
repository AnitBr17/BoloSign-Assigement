import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

const PDFField = ({
  field,
  scale,
  pdfHeight,
  containerHeight,
  onUpdate,
  onDelete,
  onSelect,
  isSelected,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(field.value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleStop = (e, data) => {
    onUpdate({
      ...field,
      x: data.x,
      y: data.y,
    });
  };

  const handleResize = (e, { size }) => {
    onUpdate({
      ...field,
      width: size.width,
      height: size.height,
    });
  };

  const handleDoubleClick = () => {
    if (field.type === 'text' || field.type === 'date') {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate({
      ...field,
      value: value,
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && field.type === 'text') {
      handleBlur();
    }
  };

  const renderFieldContent = () => {
    switch (field.type) {
      case 'text':
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
              className="w-full h-full px-2 py-1 border-2 border-blue-500 rounded text-sm"
              style={{ minHeight: '20px' }}
            />
          );
        }
        return (
          <div className="w-full h-full border-2 border-dashed border-blue-400 bg-blue-50/50 flex items-center justify-center text-xs text-gray-600">
            {value || 'Text Field'}
          </div>
        );

      case 'signature':
        return (
          <div className="w-full h-full border-2 border-dashed border-green-400 bg-green-50/50 flex items-center justify-center text-xs text-gray-600">
            {field.value ? (
              <img src={field.value} alt="Signature" className="max-w-full max-h-full object-contain" />
            ) : (
              'Signature Field'
            )}
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-full border-2 border-dashed border-purple-400 bg-purple-50/50 flex items-center justify-center text-xs text-gray-600 relative">
            {field.value ? (
              <img src={field.value} alt="Image" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center">
                <span>Image Field</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        onUpdate({ ...field, value: event.target.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="mt-2 text-xs"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        );

      case 'date':
        if (isEditing) {
          return (
            <input
              ref={inputRef}
              type="date"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleBlur}
              className="w-full h-full px-2 py-1 border-2 border-orange-500 rounded text-sm"
            />
          );
        }
        return (
          <div className="w-full h-full border-2 border-dashed border-orange-400 bg-orange-50/50 flex items-center justify-center text-xs text-gray-600">
            {value || 'Date Field'}
          </div>
        );

      case 'radio':
        return (
          <div className="w-full h-full border-2 border-dashed border-red-400 bg-red-50/50 flex items-center justify-center">
            <input
              type="radio"
              checked={field.value || false}
              onChange={(e) => {
                onUpdate({
                  ...field,
                  value: e.target.checked,
                });
              }}
              className="w-4 h-4"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const borderColor = isSelected ? 'border-blue-600' : 'border-transparent';
  const borderWidth = isSelected ? 'border-2' : 'border-0';

  return (
    <Draggable
      position={{ x: field.x, y: field.y }}
      onStop={handleStop}
      handle=".drag-handle"
      disabled={isEditing}
    >
      <div
        className={`absolute ${borderColor} ${borderWidth} cursor-move`}
        style={{
          left: field.x,
          top: field.y,
          width: field.width,
          height: field.height,
          zIndex: isSelected ? 1000 : 100,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(field.id);
        }}
        onDoubleClick={handleDoubleClick}
      >
        <Resizable
          width={field.width}
          height={field.height}
          onResize={handleResize}
          minConstraints={[50, 30]}
          handle={
            <span
              className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
              style={{
                clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
              }}
            />
          }
        >
          <div className="drag-handle w-full h-full relative">
            {renderFieldContent()}
            {isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(field.id);
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            )}
          </div>
        </Resizable>
      </div>
    </Draggable>
  );
};

export default PDFField;

