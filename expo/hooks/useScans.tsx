import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScanResult, ScanType } from '@/types';

const SCANS_STORAGE_KEY = '@petscan_scans';

export const [ScansProvider, useScans] = createContextHook(() => {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadScans = useCallback(async () => {
    try {
      console.log('[useScans] Loading scans...');
      const stored = await AsyncStorage.getItem(SCANS_STORAGE_KEY);
      console.log('[useScans] Loaded from storage:', stored ? 'data found' : 'no data');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('[useScans] Parsed data:', parsed.length, 'scans');
        setScans(parsed);
      }
    } catch (error) {
      console.error('[useScans] Error loading scans:', error);
    } finally {
      console.log('[useScans] Finished loading, setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  const addScan = useCallback(async (scan: Omit<ScanResult, 'id' | 'createdAt'>) => {
    const newScan: ScanResult = {
      ...scan,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setScans(currentScans => {
      const updated = [newScan, ...currentScans];
      AsyncStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
    return newScan;
  }, []);

  const deleteScan = useCallback(async (id: string) => {
    setScans(currentScans => {
      const updated = currentScans.filter(s => s.id !== id);
      AsyncStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const getScanById = useCallback((id: string) => {
    return scans.find(s => s.id === id);
  }, [scans]);

  const getScansByPetId = useCallback((petId: string) => {
    return scans.filter(s => s.petId === petId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [scans]);

  const getEvolutionScans = useCallback((petId: string, scanType: ScanType) => {
    return scans
      .filter(s => s.petId === petId && s.scanType === scanType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [scans]);

  return {
    scans,
    isLoading,
    addScan,
    deleteScan,
    getScanById,
    getScansByPetId,
    getEvolutionScans,
  };
});

export function usePetScans(petId: string | undefined) {
  const { getScansByPetId } = useScans();
  return useMemo(() => petId ? getScansByPetId(petId) : [], [petId, getScansByPetId]);
}
