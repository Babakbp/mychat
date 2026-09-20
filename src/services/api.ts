import { User, Group, Message } from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async login(personnelCode: string, password: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personnelCode, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در ورود به سامانه');
    return data.user;
  },

  async register(params: {
    fullName: string;
    personnelCode: string;
    mobile: string;
    subject: string;
    role?: 'teacher' | 'deputy';
    password?: string;
  }): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در ثبت‌نام');
    return data.user;
  },

  // Users
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`);
    const data = await res.json();
    return data.users || [];
  },

  async resetPassword(userId: string, newPassword?: string): Promise<{ newPassword: string }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در تغییر رمز عبور');
    return data;
  },

  // Groups
  async getGroups(userId?: string): Promise<Group[]> {
    const url = userId ? `${API_BASE}/groups?userId=${userId}` : `${API_BASE}/groups`;
    const res = await fetch(url);
    const data = await res.json();
    return data.groups || [];
  },

  async createGroup(params: {
    name: string;
    description: string;
    memberIds: string[];
    isAnnouncementOnly?: boolean;
    avatar?: string;
  }): Promise<Group> {
    const res = await fetch(`${API_BASE}/admin/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در ایجاد گروه');
    return data.group;
  },

  async updateGroupMembers(groupId: string, memberIds: string[]): Promise<Group> {
    const res = await fetch(`${API_BASE}/admin/groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در به‌روزرسانی اعضای گروه');
    return data.group;
  },

  async deleteGroup(groupId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/groups/${groupId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در حذف گروه');
  },

  // Messages
  async getMessages(chatId: string): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/messages/${chatId}`);
    const data = await res.json();
    return data.messages || [];
  },

  async sendMessage(params: {
    chatId: string;
    senderId: string;
    content: string;
    type?: 'text' | 'image' | 'voice' | 'file' | 'announcement';
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    voiceDuration?: number;
    replyTo?: { id: string; senderName: string; content: string };
  }): Promise<Message> {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در ارسال پیام');
    return data.message;
  },

  async togglePinMessage(messageId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/messages/${messageId}/pin`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در تغییر وضعیت سنجاق');
    return data.isPinned;
  },

  async reactToMessage(messageId: string, userId: string, emoji: string): Promise<Record<string, string[]>> {
    const res = await fetch(`${API_BASE}/messages/${messageId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, emoji }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در ثبت واکنش');
    return data.reactions;
  },
};

// Real-time WebSocket manager
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;
  private reconnectTimer: any = null;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('[WebSocket] Connected to School Chat server');
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const handlers = this.listeners.get(payload.type);
          if (handlers) {
            handlers.forEach(fn => fn(payload.data));
          }
          // Also trigger wildcard
          const anyHandlers = this.listeners.get('*');
          if (anyHandlers) {
            anyHandlers.forEach(fn => fn(payload));
          }
        } catch (e) {
          console.error('[WebSocket] Message parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        // Reconnect after 3s
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = (err) => {
        console.warn('[WebSocket] Connection notice:', err);
      };
    } catch (err) {
      console.warn('[WebSocket] Init notice:', err);
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    }
  }

  on(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const realtime = new RealtimeClient();
