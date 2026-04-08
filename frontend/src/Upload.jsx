import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, Trash2, FileText, RefreshCw } from 'lucide-react';
import { uploadDocument, listDocuments, deleteDocument } from './api';

export default function Upload({ setError }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await listDocuments();
      if (data && data.documents) setDocuments(data.documents);
    } catch (err) {
      setError(err.message || 'Failed to load documents.');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await doUpload(file);
  };

  const doUpload = async (file) => {
    setUploading(true);
    try {
      await uploadDocument(file);
      setError(null);
      await loadDocuments();
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
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
    const confirmed = window.confirm(`Delete "${doc.filename}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteDocument(doc.id, doc.filename);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setError(null);
    } catch (err) {
      setError(err.message || 'Delete failed.');
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
        <button className="btn btn-outline btn-sm" onClick={loadDocuments}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div
        className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dropzone-icon">
          <UploadIcon size={40} strokeWidth={1.2} />
        </div>
        <p className="dropzone-text">
          {uploading ? 'Uploading...' : 'Drag & drop a file here, or click to browse'}
        </p>
        <input
          type="file"
          className="dropzone-input"
          onChange={handleFileChange}
          accept=".txt,.md,.csv"
          disabled={uploading}
        />
        <p className="dropzone-hint">Supported: TXT, Markdown, CSV</p>
      </div>

      <div className="documents-list">
        <h3>Uploaded Documents ({documents.length})</h3>
        {documents.length === 0 ? (
          <div className="documents-empty">
            <p>No documents uploaded yet. Upload a document to get started.</p>
          </div>
        ) : (
          <div className="document-grid">
            {documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-card-info">
                  <div className="document-card-name" title={doc.filename}>
                    <FileText size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
                    {doc.filename}
                  </div>
                  <div className="document-card-meta">
                    {formatFileSize(doc.size)} &middot; {doc.uploaded_at}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => handleDelete(doc)}
                  title="Delete document"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
