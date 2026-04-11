import Dexie, { Table } from 'dexie';
import { DiaryEntry, KnowledgeItem, Artwork, UserProfile, ChatMessage, AppSettings } from '@/types';

export class MoodDiaryDB extends Dexie {
  diary!: Table<DiaryEntry>;
  knowledge!: Table<KnowledgeItem>;
  artworks!: Table<Artwork>;
  profile!: Table<UserProfile>;
  chatMessages!: Table<ChatMessage>;
  settings!: Table<AppSettings>;

  constructor() {
    super('MoodDiaryDB');
    this.version(1).stores({
      diary: 'id, date, mood, createdAt',
      knowledge: 'id, title, source, createdAt',
      artworks: 'id, createdAt',
      profile: 'id',
    });
    this.version(2).stores({
      diary: 'id, date, mood, createdAt',
      knowledge: 'id, title, source, createdAt',
      artworks: 'id, createdAt',
      profile: 'id',
      chatMessages: 'id, createdAt',
      settings: 'id',
    });
  }
}

export const db = new MoodDiaryDB();
