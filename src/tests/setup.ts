import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Dexie for IndexedDB testing
const mockDexie = {
  diary: {
    add: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    toArray: vi.fn().mockResolvedValue([]),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    between: vi.fn().mockReturnThis(),
    first: vi.fn(),
    update: vi.fn(),
  },
  knowledge: {
    add: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    toArray: vi.fn().mockResolvedValue([]),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    first: vi.fn(),
    update: vi.fn(),
  },
  artworks: {
    add: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    toArray: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockReturnThis(),
    reverse: vi.fn().mockReturnThis(),
  },
  profile: {
    add: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    toArray: vi.fn().mockResolvedValue([]),
  },
}

vi.mock('@/lib/db', () => ({
  db: mockDexie,
  MoodDiaryDB: vi.fn().mockImplementation(() => mockDexie),
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
}))
