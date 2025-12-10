import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../services/api';

interface QRCode {
  id: string;
  uniqueCode: string;
  label: string | null;
  createdAt: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt: string | null;
}

interface QRCodeLead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string | null;
  message: string | null;
  createdAt: string;
  convertedToUser: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const QRCodeManager: React.FC = () => {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [selectedQRCode, setSelectedQRCode] = useState<QRCode | null>(null);
  const [leads, setLeads] = useState<QRCodeLead[]>([]);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCodes = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/qr-codes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch QR codes');

      const data = await response.json();
      setQrCodes(data);
    } catch (err) {
      console.error('Error fetching QR codes:', err);
      setError('Failed to load QR codes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQRCodeDetails = async (id: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/qr-codes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch QR code details');

      const data = await response.json();
      setQrCodeDataURL(data.qrCodeDataURL);
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Error fetching QR code details:', err);
      setError('Failed to load QR code details');
    }
  };

  useEffect(() => {
    fetchQRCodes();
  }, []);

  useEffect(() => {
    if (selectedQRCode) {
      fetchQRCodeDetails(selectedQRCode.id);
    }
  }, [selectedQRCode]);

  const handleCreateQRCode = async () => {
    if (!newLabel.trim()) {
      setError('Please enter a label for the QR code');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/qr-codes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label: newLabel }),
      });

      if (!response.ok) throw new Error('Failed to create QR code');

      const newQRCode = await response.json();
      // Ensure the QR code data matches the QRCode interface structure
      const formattedQRCode: QRCode = {
        id: newQRCode.id,
        uniqueCode: newQRCode.uniqueCode,
        label: newQRCode.label,
        createdAt: newQRCode.createdAt,
        isActive: true,
        scanCount: 0,
        lastScannedAt: null,
      };
      setQrCodes([formattedQRCode, ...qrCodes]);
      setNewLabel('');
      setShowCreateForm(false);
      setSelectedQRCode(formattedQRCode);
    } catch (err) {
      console.error('Error creating QR code:', err);
      setError('Failed to create QR code');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (qrCode: QRCode) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/qr-codes/${qrCode.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !qrCode.isActive }),
      });

      if (!response.ok) throw new Error('Failed to update QR code');

      const updatedData = await response.json();
      // Transform snake_case from backend to camelCase for frontend
      const updated: QRCode = {
        id: updatedData.id,
        uniqueCode: updatedData.unique_code,
        label: updatedData.label,
        createdAt: updatedData.created_at,
        isActive: updatedData.is_active,
        scanCount: updatedData.scan_count || 0,
        lastScannedAt: updatedData.last_scanned_at || null,
      };
      setQrCodes(qrCodes.map(qr => qr.id === updated.id ? updated : qr));
      if (selectedQRCode?.id === updated.id) {
        setSelectedQRCode(updated);
      }
    } catch (err) {
      console.error('Error toggling QR code:', err);
      setError('Failed to update QR code');
    }
  };

  const handleDelete = async (qrCode: QRCode) => {
    if (!confirm(`Are you sure you want to delete "${qrCode.label || 'Unnamed QR Code'}"?`)) {
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/qr-codes/${qrCode.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete QR code');

      setQrCodes(qrCodes.filter(qr => qr.id !== qrCode.id));
      if (selectedQRCode?.id === qrCode.id) {
        setSelectedQRCode(null);
        setQrCodeDataURL(null);
        setLeads([]);
      }
    } catch (err) {
      console.error('Error deleting QR code:', err);
      setError('Failed to delete QR code');
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCodeDataURL || !selectedQRCode) return;

    const link = document.createElement('a');
    link.href = qrCodeDataURL;
    link.download = `qr-code-${selectedQRCode.label || selectedQRCode.uniqueCode}.png`;
    link.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">QR Code Lead Capture</h1>
        <p className="text-slate-400">Generate QR codes to capture leads at events and conferences</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Codes List */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Your QR Codes</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + New
              </button>
            </div>

            {showCreateForm && (
              <div className="mb-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                <input
                  type="text"
                  placeholder="QR Code Label (e.g., 'Tech Conference 2025')"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateQRCode}
                    disabled={isCreating}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewLabel('');
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {qrCodes.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No QR codes yet. Create one to get started!</p>
              ) : (
                qrCodes.map((qr) => (
                  <div
                    key={qr.id}
                    onClick={() => setSelectedQRCode(qr)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedQRCode?.id === qr.id
                        ? 'bg-sky-900/20 border-sky-500'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{qr.label || 'Unnamed QR Code'}</h3>
                        <p className="text-sm text-slate-400 mt-1">Scans: {qr.scanCount}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs ${
                              qr.isActive
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {qr.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* QR Code Details */}
        <div className="lg:col-span-2">
          {selectedQRCode ? (
            <div className="space-y-6">
              {/* QR Code Display */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedQRCode.label || 'Unnamed QR Code'}</h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Created {new Date(selectedQRCode.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(selectedQRCode)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedQRCode.isActive
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      }`}
                    >
                      {selectedQRCode.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedQRCode)}
                      className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {qrCodeDataURL && (
                  <div className="flex flex-col items-center">
                    <img src={qrCodeDataURL} alt="QR Code" className="w-64 h-64 bg-white p-4 rounded-lg" />
                    <button
                      onClick={handleDownloadQRCode}
                      className="mt-4 bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Download QR Code
                    </button>
                  </div>
                )}

                <div className="mt-6 p-4 bg-slate-900 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Lead Capture URL:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/lead-capture/${selectedQRCode.uniqueCode}`}
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/lead-capture/${selectedQRCode.uniqueCode}`)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-slate-900 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{selectedQRCode.scanCount}</p>
                    <p className="text-sm text-slate-400 mt-1">Total Scans</p>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{leads.length}</p>
                    <p className="text-sm text-slate-400 mt-1">Leads Captured</p>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                      {selectedQRCode.lastScannedAt
                        ? new Date(selectedQRCode.lastScannedAt).toLocaleDateString()
                        : 'Never'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">Last Scan</p>
                  </div>
                </div>
              </div>

              {/* Leads Table */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Captured Leads ({leads.length})</h3>
                {leads.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No leads captured yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Company</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Contact</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Phone</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Industry</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => (
                          <tr key={lead.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                            <td className="py-3 px-4 text-sm text-white">{lead.companyName}</td>
                            <td className="py-3 px-4 text-sm text-white">{lead.contactName}</td>
                            <td className="py-3 px-4 text-sm text-sky-400">{lead.email}</td>
                            <td className="py-3 px-4 text-sm text-white">{lead.phone}</td>
                            <td className="py-3 px-4 text-sm text-slate-400">{lead.industry || '-'}</td>
                            <td className="py-3 px-4 text-sm text-slate-400">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 flex flex-col items-center justify-center text-center">
              <svg
                className="w-16 h-16 text-slate-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">Select a QR Code</h3>
              <p className="text-slate-400">Choose a QR code from the list to view details and manage leads</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeManager;
