import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const DocumentList = () => {
  const navigate = useNavigate();

  const handleDocumentClick = (document) => {
    let documentId = document.id;
    
    if (documentId.startsWith('/')) {
      documentId = documentId.substring(1);
    }
    
    navigate(`/documents/${documentId}`);
  };

  return (
    <div>
      {/* Render your document list here */}
    </div>
  );
};

export default DocumentList; 