import React, { useState, useEffect } from 'react';
import { uploadDocument, listDocuments, deleteDocument } from './api';

export default function Upload({ setError }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const data = await listDocuments();
    if (data && data.documents) {
      setDocuments(data.documents);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await doUpload(file);
  };

  const doUpload = async (file) => {
    setUploading(true);
    const result = await uploadDocument(file);
    if (result) {
      // BUG: does not refresh the document list after upload
      // Should call loadDocuments() here
      setError(null);
    } else {
      setError('Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      doUpload(file);
    }
  };

  const handleDelete = async (doc) => {
    // BUG: vague delete confirmation — doesn't show the document name
    const confirmed = window.confirm('Are you sure you want to delete this item?');
    if (!confirmed) return;

    const result = await deleteDocument(doc.id);
    if (result) {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } else {
      setError('Delete failed.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h2>Document Management</h2>
        <button className="btn btn-secondary" onClick={loadDocuments}>
          Refresh
        </button>
      </div>

      <div
        className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dropzone-content">
          <div className="dropzone-icon">📁</div>
          <p className="dropzone-text">
            {uploading ? 'Uploading...' : 'Drag & drop a file here, or click to browse'}
          </p>
          <input
            type="file"
            className="dropzone-input"
            onChange={handleFileChange}
            // BUG: accept includes .doc which the backend may not support
            accept=".pdf,.txt,.md,.doc,.docx,.csv"
            disabled={uploading}
          />
          <p className="dropzone-hint">Supported: PDF, TXT, Markdown, Word, CSV</p>
        </div>
      </div>

      <div className="documents-list">
        <h3>Uploaded Documents ({documents.length})</h3>
        {documents.length === 0 ? (
          <div className="documents-empty">
            <p>No documents uploaded yet. Upload a document to get started.</p>
          </div>
        ) : (
          <table className="documents-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="doc-name">{doc.filename}</td>
                  <td>{formatFileSize(doc.size)}</td>
                  <td>{doc.uploaded_at}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(doc)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
