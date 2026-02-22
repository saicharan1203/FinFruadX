import React, { useState } from 'react';
import { Box } from '@mui/material';
import { FiDownload, FiFileText, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import './DownloadDialog.css';

const DownloadDialog = ({
    isOpen,
    onClose,
    onDownload,
    title = "Download Data",
    description = "Choose your preferred format to download the data."
}) => {
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadComplete, setDownloadComplete] = useState(false);

    const formats = [
        {
            id: 'pdf',
            name: 'PDF Document',
            icon: '📄',
            description: 'Best for printing and sharing',
            extension: '.pdf',
            color: '#e74c3c'
        },
        {
            id: 'excel',
            name: 'Excel Spreadsheet',
            icon: '📊',
            description: 'Best for data analysis',
            extension: '.xlsx',
            color: '#27ae60'
        }
    ];

    const handleFormatSelect = (format) => {
        setSelectedFormat(format);
        setDownloadComplete(false);
    };

    const handleDownload = async () => {
        if (!selectedFormat) return;

        setIsDownloading(true);
        try {
            await onDownload(selectedFormat);
            setDownloadComplete(true);
            setTimeout(() => {
                setDownloadComplete(false);
                setSelectedFormat(null);
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleClose = () => {
        setSelectedFormat(null);
        setDownloadComplete(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Box className="download-dialog-overlay" onClick={handleClose}>
            <Box className="download-dialog" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <Box className="download-dialog-header">
                    <Box className="download-dialog-icon">
                        <FiDownload size={24} />
                    </Box>
                    <Box className="download-dialog-title-section">
                        <h2>{title}</h2>
                        <p>{description}</p>
                    </Box>
                    <button className="download-dialog-close" onClick={handleClose}>
                        <FiX size={20} />
                    </button>
                </Box>

                {/* Format Options */}
                <Box className="download-format-options">
                    {formats.map((format) => (
                        <button
                            key={format.id}
                            className={`download-format-card ${selectedFormat === format.id ? 'selected' : ''}`}
                            onClick={() => handleFormatSelect(format.id)}
                            style={{ '--format-color': format.color }}
                        >
                            <div className="format-icon">{format.icon}</div>
                            <div className="format-info">
                                <h3>{format.name}</h3>
                                <p>{format.description}</p>
                            </div>
                            <div className="format-badge">{format.extension}</div>
                            {selectedFormat === format.id && (
                                <div className="format-check">
                                    <FiCheck size={16} />
                                </div>
                            )}
                        </button>
                    ))}
                </Box>

                {/* Action Buttons */}
                <Box className="download-dialog-actions">
                    <button className="download-cancel-btn" onClick={handleClose}>
                        Cancel
                    </button>
                    <button
                        className={`download-confirm-btn ${!selectedFormat ? 'disabled' : ''} ${downloadComplete ? 'success' : ''}`}
                        onClick={handleDownload}
                        disabled={!selectedFormat || isDownloading}
                    >
                        {isDownloading ? (
                            <>
                                <FiLoader className="spin" size={18} />
                                <span>Downloading...</span>
                            </>
                        ) : downloadComplete ? (
                            <>
                                <FiCheck size={18} />
                                <span>Downloaded!</span>
                            </>
                        ) : (
                            <>
                                <FiDownload size={18} />
                                <span>Download {selectedFormat ? selectedFormat.toUpperCase() : ''}</span>
                            </>
                        )}
                    </button>
                </Box>
            </Box>
        </Box>
    );
};

export default DownloadDialog;
