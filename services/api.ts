const API_BASE_URL = 'http://localhost:3001/api';

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

export default {
  auth: authAPI,
  profile: profileAPI,
  documents: documentsAPI,
  rfp: rfpAPI,
  proposals: proposalsAPI,
};
