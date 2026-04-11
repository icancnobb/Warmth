export interface DiaryEntry {
  id: string;
  date: string;
  mood: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  source: 'manual' | 'file';
  fileName?: string;
  createdAt: number;
}

export interface Artwork {
  id: string;
  imageData: string;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  nickname: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'secret';
  signature?: string;
  avatar?: string;
  customMoods?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface AppSettings {
  id: string;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface ExportData {
  version: string;
  exportedAt: string;
  diary: DiaryEntry[];
  knowledge: KnowledgeItem[];
  artworks: Artwork[];
  profile: UserProfile | null;
  chatMessages: ChatMessage[];
  settings: AppSettings | null;
}

export const DEFAULT_MOODS = ['开心', '平静', '一般', '难过', '糟糕'];

export const MOOD_COLORS: Record<string, string> = {
  '开心': '#4ADE80',
  '平静': '#60A5FA',
  '一般': '#FCD34D',
  '难过': '#F87171',
  '糟糕': '#94A3B8',
};

export const MOOD_EMOJIS: Record<string, string> = {
  '开心': '😄',
  '平静': '😌',
  '一般': '😐',
  '难过': '😢',
  '糟糕': '💔',
};
