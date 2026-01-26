/**
 * Export Utilities for PDF and Excel
 * Uses browser-native and minimal dependencies
 */

// Format date for filenames
const getFormattedDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

// Convert data to CSV format
const convertToCSV = (data, headers) => {
    if (!data || data.length === 0) return '';

    const headerRow = headers ? headers.join(',') : Object.keys(data[0]).join(',');
    const rows = data.map(row => {
        if (headers) {
            return headers.map(header => {
                const value = row[header] ?? '';
                return typeof value === 'string' && value.includes(',')
                    ? `"${value}"`
                    : value;
            }).join(',');
        }
        return Object.values(row).map(value => {
            return typeof value === 'string' && value.includes(',')
                ? `"${value}"`
                : value;
        }).join(',');
    });

    return [headerRow, ...rows].join('\n');
};

// Download as Excel (CSV format that Excel can open)
export const downloadAsExcel = (data, filename = 'export', headers = null) => {
    return new Promise((resolve, reject) => {
        try {
            const csvContent = convertToCSV(data, headers);
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}_${getFormattedDate()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

// Download as PDF (using browser print functionality)
export const downloadAsPDF = (data, filename = 'export', title = 'Data Export', headers = null) => {
    return new Promise((resolve, reject) => {
        try {
            // Create a new window for printing
            const printWindow = window.open('', '_blank');

            if (!printWindow) {
                alert('Please allow popups to download PDF');
                reject(new Error('Popup blocked'));
                return;
            }

            // Build HTML content
            const tableHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);

            const tableContent = `
        <table>
          <thead>
            <tr>
              ${tableHeaders.map(h => `<th>${formatHeader(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${tableHeaders.map(h => `<td>${formatValue(row[h])}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

            const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #1a1a2e;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #6a11cb;
            }
            .logo { 
              font-size: 24px; 
              font-weight: 700;
              background: linear-gradient(135deg, #6a11cb, #2575fc);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .date { font-size: 14px; color: #6b7280; }
            h1 { 
              font-size: 28px; 
              margin-bottom: 8px;
              color: #1a1a2e;
            }
            .subtitle {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 30px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              font-size: 12px;
            }
            th { 
              background: linear-gradient(135deg, #6a11cb, #2575fc);
              color: white;
              padding: 12px 16px;
              text-align: left;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
            }
            td { 
              padding: 12px 16px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) { background: #f9fafb; }
            tr:hover { background: #f3f4f6; }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            .stats {
              display: flex;
              gap: 40px;
              margin-bottom: 30px;
            }
            .stat-item {
              padding: 16px 24px;
              background: linear-gradient(135deg, rgba(106, 17, 203, 0.1), rgba(37, 117, 252, 0.1));
              border-radius: 12px;
            }
            .stat-value { font-size: 24px; font-weight: 700; color: #6a11cb; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="logo">🛡️ FinFraudX</span>
            <span class="date">Generated: ${new Date().toLocaleString()}</span>
          </div>
          
          <h1>${title}</h1>
          <p class="subtitle">Fraud Detection Analysis Report • ${data.length} records</p>
          
          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">${data.length}</div>
              <div class="stat-label">Total Records</div>
            </div>
          </div>
          
          ${tableContent}
          
          <div class="footer">
            <p>Generated by FinFraudX - AI-Powered Fraud Detection System</p>
            <p>© ${new Date().getFullYear()} FinFraudX. All rights reserved.</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            };
          </script>
        </body>
        </html>
      `;

            printWindow.document.write(htmlContent);
            printWindow.document.close();

            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

// Format header text
const formatHeader = (header) => {
    return header
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
};

// Format cell value
const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
        if (value % 1 !== 0) return value.toFixed(2);
        return value.toLocaleString();
    }
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
};

// Main export function
export const exportData = async (format, data, options = {}) => {
    const { filename = 'finfraudx_export', title = 'Data Export', headers = null } = options;

    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    if (format === 'excel') {
        await downloadAsExcel(data, filename, headers);
    } else if (format === 'pdf') {
        await downloadAsPDF(data, filename, title, headers);
    }
};

export default exportData;
