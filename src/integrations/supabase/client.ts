// src/lib/api.ts
import axios from "axios";

// Типы для Auth
interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string };
}
interface RegisterData {
  name: string;
  email: string;
  password: string;
}
interface LoginData {
  email: string;
  password: string;
}

// Типы для Workspace
interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  owner_id: string;
  invite_link_enabled: boolean;
  invite_link_token: string;
}
// Типы для Notes
interface Note {
  id: string;
  title: string;
  content: string;
  workspaceId: string;
}

// Типы для Attachments
interface Attachment {
  id: string;
  filename: string;
  url: string;
}

// Axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BACKEND,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth helpers
export const auth = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/login", data);
    console.log("res", res)
    localStorage.setItem("token", res.data.token);
    return res.data;
  },
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/register", data);
    console.log("res", res)
    localStorage.setItem("token", res.data.token);
    return res.data;
  },
};

// Workspaces helpers
// src/integrations/supabase/client.ts

export const workspaces = {
  getAll: async (): Promise<Workspace[]> => {
    const res = await api.get<Workspace[]>("/workspaces");
    return res.data;
  },
  getMembers: async (workspaceId: string) => {
    const res = await api.get(`/workspaces/${workspaceId}/members`);
    return res.data;
  },
  getInvites: async (workspaceId: string) => {
    const res = await api.get(`/workspaces/${workspaceId}/invites`);
    return res.data;
  },
  inviteMember: async (workspaceId: string, email: string, invitedBy: string, role = "editor") => {
    const res = await api.post(`/workspaces/${workspaceId}/invite`, {
      email,
      invitedBy,
      role,
    });
    return res.data;
  },
  removeMember: async (workspaceId: string, memberId: string) => {
    const res = await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
    return res.data;
  },
  addMember: async (workspaceId: string, userId: string, role = "editor") => {
    const res = await api.post(`/workspaces/${workspaceId}/members`, {
      userId,
      role,
    });
    return res.data;
  },
  create: async (data: Partial<Workspace>): Promise<Workspace> => {
    const res = await api.post<Workspace>("/workspaces", data);
    return res.data;
  },
  update: async (id: string, data: Partial<Workspace>): Promise<Workspace> => {
    const res = await api.put<Workspace>(`/workspaces/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workspaces/${id}`);
  },
};

// Notes helpers
export const notes = {
  getAll: async (workspaceId: string): Promise<Note[]> => {
    const res = await api.get<Note[]>(`/notes?workspaceId=${workspaceId}`);
    return res.data;
  },
  create: async (data: Partial<Note>): Promise<Note> => {
    const res = await api.post<Note>("/notes", data);
    return res.data;
  },
  update: async (id: string, data: Partial<Note>): Promise<Note> => {
    const res = await api.put<Note>(`/notes/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },
};

// Attachments helpers
export const attachments = {
  upload: async (file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<Attachment>("/attachments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  get: async (id: string): Promise<Attachment> => {
    const res = await api.get<Attachment>(`/attachments/${id}`);
    return res.data;
  },
};