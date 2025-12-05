// Debug: Log environment variable
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('All env vars:', import.meta.env);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
console.log('Using API_BASE_URL:', API_BASE_URL);

// Token management
let authToken: string | null = localStorage.getItem('authToken');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = () => authToken;

// Base fetch with auth
const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setAuthToken(null);
    window.location.href = '/';
  }

  return response;
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, fullName: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    // Token is in session.access_token from Supabase
    if (data.session?.access_token) {
      setAuthToken(data.session.access_token);
      // Also add fullName to user for display
      data.user.fullName = data.profile?.company_name || data.user.email;
    }
    // Map to expected format
    if (data.session?.access_token) {
      data.token = data.session.access_token;
    }
    return data;
  },

  logout: async () => {
    const response = await authFetch('/auth/logout', { method: 'POST' });
    setAuthToken(null);
    return response.json();
  },

  getMe: async () => {
    const response = await authFetch('/auth/me');
    return response.json();
  },

  forgotPassword: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },
};

// Profile API
export const profileAPI = {
  get: async () => {
    const response = await authFetch('/profile');
    return response.json();
  },

  update: async (data: any) => {
    const response = await authFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getMarketplace: async (params?: { industry?: string; search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    const response = await authFetch(`/profile/marketplace${query ? `?${query}` : ''}`);
    return response.json();
  },

  getById: async (id: string) => {
    const response = await authFetch(`/profile/${id}`);
    return response.json();
  },
};

// Documents API
export const documentsAPI = {
  list: async () => {
    const response = await authFetch('/documents');
    return response.json();
  },

  upload: async (file: File, documentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });
    return response.json();
  },

  delete: async (id: string) => {
    const response = await authFetch(`/documents/${id}`, { method: 'DELETE' });
    return response.json();
  },

  download: async (id: string) => {
    const response = await authFetch(`/documents/${id}/download`);
    return response.blob();
  },
};

// RFP API
export const rfpAPI = {
  list: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    const response = await authFetch(`/rfp${query ? `?${query}` : ''}`);
    return response.json();
  },

  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/rfp/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });
    return response.json();
  },

  get: async (id: string) => {
    const response = await authFetch(`/rfp/${id}`);
    return response.json();
  },

  reparse: async (id: string) => {
    const response = await authFetch(`/rfp/${id}/reparse`, { method: 'POST' });
    return response.json();
  },

  delete: async (id: string) => {
    const response = await authFetch(`/rfp/${id}`, { method: 'DELETE' });
    return response.json();
  },
};

// Proposals API
export const proposalsAPI = {
  list: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    const response = await authFetch(`/proposals${query ? `?${query}` : ''}`);
    return response.json();
  },

  create: async (data: { title: string; content?: any; status?: string; template?: string }) => {
    const response = await authFetch('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  generate: async (rfpId: string, template?: string) => {
    const response = await authFetch('/proposals/generate', {
      method: 'POST',
      body: JSON.stringify({ rfpId, template }),
    });
    return response.json();
  },

  get: async (id: string) => {
    const response = await authFetch(`/proposals/${id}`);
    return response.json();
  },

  update: async (id: string, data: { title?: string; content?: any; status?: string }) => {
    const response = await authFetch(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  refine: async (id: string, sectionName: string, currentContent: string, improvementGoals: string[]) => {
    const response = await authFetch(`/proposals/${id}/refine`, {
      method: 'POST',
      body: JSON.stringify({ sectionName, currentContent, improvementGoals }),
    });
    return response.json();
  },

  updateStatus: async (id: string, status: string) => {
    const response = await authFetch(`/proposals/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response.json();
  },

  delete: async (id: string) => {
    const response = await authFetch(`/proposals/${id}`, { method: 'DELETE' });
    return response.json();
  },

  exportDocx: async (id: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/proposals/${id}/export/docx`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to export DOCX');
    }
    return response.blob();
  },

  exportPdf: async (id: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/proposals/${id}/export/pdf`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to export PDF');
    }
    return response.blob();
  },
};

// Team Invitations API
export const teamAPI = {
  invite: async (data: {
    proposalId: string;
    memberEmail: string;
    role: string;
    rateRange?: { min: number; max: number };
    message?: string;
  }) => {
    const response = await authFetch('/team/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    // If response is not OK, ensure error format is consistent
    if (!response.ok) {
      return {
        error: result.error || 'Request failed',
        message: result.message || result.error || 'Unknown error'
      };
    }
    
    return result;
  },

  getProposalTeam: async (proposalId: string) => {
    const response = await authFetch(`/team/proposal/${proposalId}`);
    return response.json();
  },

  getMyInvitations: async () => {
    const response = await authFetch('/team/invitations');
    return response.json();
  },

  getInvitationByToken: async (token: string) => {
    // This endpoint should be public (no auth required for email links)
    const response = await fetch(`${API_BASE_URL}/team/invitations/token/${token}`);
    return response.json();
  },

  acceptInvitation: async (invitationId: string, token?: string) => {
    const response = await authFetch(`/team/invitations/${invitationId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return response.json();
  },

  declineInvitation: async (invitationId: string) => {
    const response = await authFetch(`/team/invitations/${invitationId}/decline`, {
      method: 'POST',
    });
    return response.json();
  },

  removeTeamMember: async (proposalId: string, memberId: string) => {
    const response = await authFetch(`/team/proposal/${proposalId}/member/${memberId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Analytics API
export const analyticsAPI = {
  getProposalTimes: async (proposalId?: string) => {
    const url = proposalId 
      ? `/analytics/proposal-times?proposalId=${proposalId}`
      : '/analytics/proposal-times';
    const response = await authFetch(url);
    return response.json();
  },

  getTeamResponses: async () => {
    const response = await authFetch('/analytics/team-responses');
    return response.json();
  },

  trackStageStart: async (proposalId: string, stage: string) => {
    const response = await authFetch('/analytics/track-stage', {
      method: 'POST',
      body: JSON.stringify({ proposalId, stage }),
    });
    return response.json();
  },

  trackStageComplete: async (trackingId: string) => {
    const response = await authFetch(`/analytics/track-stage/${trackingId}/complete`, {
      method: 'PUT',
    });
    return response.json();
  },
};

// Network API
export const networkAPI = {
  createConnection: async (data: {
    contactName: string;
    contactEmail: string;
    capabilities?: string[];
    notes?: string;
    connectedProfileId?: string;
    connectionMethod?: string;
  }) => {
    const response = await authFetch('/network/connections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getUserConnections: async (params?: { search?: string; capability?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    const response = await authFetch(`/network/connections${query ? `?${query}` : ''}`);
    return response.json();
  },

  deleteConnection: async (id: string) => {
    const response = await authFetch(`/network/connections/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Connection Requests
  sendConnectionRequest: async (data: {
    recipientProfileId: string;
    message?: string;
  }) => {
    const response = await authFetch('/network/connection-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getMyConnectionRequests: async () => {
    const response = await authFetch('/network/connection-requests');
    return response.json();
  },

  acceptConnectionRequest: async (id: string) => {
    const response = await authFetch(`/network/connection-requests/${id}/accept`, {
      method: 'POST',
    });
    return response.json();
  },

  declineConnectionRequest: async (id: string) => {
    const response = await authFetch(`/network/connection-requests/${id}/decline`, {
      method: 'POST',
    });
    return response.json();
  },
};

export default {
  auth: authAPI,
  profile: profileAPI,
  documents: documentsAPI,
  rfp: rfpAPI,
  proposals: proposalsAPI,
  team: teamAPI,
  analytics: analyticsAPI,
  network: networkAPI,
};
