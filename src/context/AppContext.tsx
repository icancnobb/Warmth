import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { db } from '@/lib/db';
import { DiaryEntry, KnowledgeItem, Artwork, UserProfile } from '@/types';

// State interface
interface AppState {
  entries: DiaryEntry[];
  knowledge: KnowledgeItem[];
  artworks: Artwork[];
  profile: UserProfile | null;
  isLoading: boolean;
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_ALL_DATA'; payload: { entries: DiaryEntry[]; knowledge: KnowledgeItem[]; artworks: Artwork[]; profile: UserProfile | null } }
  | { type: 'ADD_ENTRY'; payload: DiaryEntry }
  | { type: 'UPDATE_ENTRY'; payload: { id: string; updates: Partial<DiaryEntry> } }
  | { type: 'ADD_KNOWLEDGE'; payload: KnowledgeItem }
  | { type: 'DELETE_KNOWLEDGE'; payload: string }
  | { type: 'ADD_ARTWORK'; payload: Artwork }
  | { type: 'DELETE_ARTWORK'; payload: string }
  | { type: 'UPDATE_PROFILE'; payload: UserProfile };

// Initial state
const initialState: AppState = {
  entries: [],
  knowledge: [],
  artworks: [],
  profile: null,
  isLoading: true,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOAD_ALL_DATA':
      return {
        ...state,
        entries: action.payload.entries,
        knowledge: action.payload.knowledge,
        artworks: action.payload.artworks,
        profile: action.payload.profile,
        isLoading: false,
      };
    case 'ADD_ENTRY':
      return { ...state, entries: [...state.entries, action.payload] };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map(e =>
          e.id === action.payload.id ? { ...e, ...action.payload.updates } : e
        ),
      };
    case 'ADD_KNOWLEDGE':
      return { ...state, knowledge: [...state.knowledge, action.payload] };
    case 'DELETE_KNOWLEDGE':
      return {
        ...state,
        knowledge: state.knowledge.filter(k => k.id !== action.payload),
      };
    case 'ADD_ARTWORK':
      return { ...state, artworks: [...state.artworks, action.payload] };
    case 'DELETE_ARTWORK':
      return {
        ...state,
        artworks: state.artworks.filter(a => a.id !== action.payload),
      };
    case 'UPDATE_PROFILE':
      return { ...state, profile: action.payload };
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper actions that also persist to Dexie
  addEntry: (entry: DiaryEntry) => Promise<void>;
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => Promise<void>;
  addKnowledge: (item: KnowledgeItem) => Promise<void>;
  deleteKnowledge: (id: string) => Promise<void>;
  addArtwork: (artwork: Artwork) => Promise<void>;
  deleteArtwork: (id: string) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load all data from Dexie on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [entries, knowledge, artworks, profile] = await Promise.all([
          db.diary.toArray(),
          db.knowledge.toArray(),
          db.artworks.toArray(),
          db.profile.get('user'),
        ]);
        dispatch({
          type: 'LOAD_ALL_DATA',
          payload: { entries, knowledge, artworks, profile: profile || null },
        });
      } catch (error) {
        console.error('Failed to load data:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    loadData();
  }, []);

  // Helper functions that persist to Dexie
  const addEntry = async (entry: DiaryEntry) => {
    await db.diary.add(entry);
    dispatch({ type: 'ADD_ENTRY', payload: entry });
  };

  const updateEntry = async (id: string, updates: Partial<DiaryEntry>) => {
    await db.diary.update(id, updates);
    dispatch({ type: 'UPDATE_ENTRY', payload: { id, updates } });
  };

  const addKnowledge = async (item: KnowledgeItem) => {
    await db.knowledge.add(item);
    dispatch({ type: 'ADD_KNOWLEDGE', payload: item });
  };

  const deleteKnowledge = async (id: string) => {
    await db.knowledge.delete(id);
    dispatch({ type: 'DELETE_KNOWLEDGE', payload: id });
  };

  const addArtwork = async (artwork: Artwork) => {
    await db.artworks.add(artwork);
    dispatch({ type: 'ADD_ARTWORK', payload: artwork });
  };

  const deleteArtwork = async (id: string) => {
    await db.artworks.delete(id);
    dispatch({ type: 'DELETE_ARTWORK', payload: id });
  };

  const updateProfile = async (profile: UserProfile) => {
    await db.profile.put(profile);
    dispatch({ type: 'UPDATE_PROFILE', payload: profile });
  };

  const value: AppContextType = {
    state,
    dispatch,
    addEntry,
    updateEntry,
    addKnowledge,
    deleteKnowledge,
    addArtwork,
    deleteArtwork,
    updateProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export type { AppState, AppAction };
