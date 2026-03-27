export type Species = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';

export type ScanType = 'skin' | 'eyes' | 'teeth' | 'wound' | 'posture';

export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface Pet {
  id: string;
  name: string;
  species: Species;
  breed?: string;
  age: number;
  weight: number;
  imageUri?: string;
  createdAt: string;
}

export interface ScanResult {
  id: string;
  petId: string;
  scanType: ScanType;
  imageUri: string;
  analysis: AnalysisResult;
  createdAt: string;
}

export interface AnalysisResult {
  visualAnalysis: string;
  compatibility: {
    condition: string;
    probability?: number;
  }[];
  urgencyLevel: UrgencyLevel;
  urgencyClassification: string;
  careGuide: string[];
  disclaimer: string;
}

export const SCAN_TYPE_LABELS: Record<ScanType, string> = {
  skin: 'Piel/Pelaje',
  eyes: 'Ojos/Oídos',
  teeth: 'Dientes',
  wound: 'Herida',
  posture: 'Postura',
};

export const SCAN_TYPE_ICONS: Record<ScanType, string> = {
  skin: 'Sparkles',
  eyes: 'Eye',
  teeth: 'Smile',
  wound: 'Bandage',
  posture: 'Activity',
};

export const SPECIES_LABELS: Record<Species, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  rabbit: 'Conejo',
  other: 'Otro',
};

export const SPECIES_ICONS: Record<Species, string> = {
  dog: '🐕',
  cat: '🐱',
  bird: '🐦',
  rabbit: '🐰',
  other: '🐾',
};
