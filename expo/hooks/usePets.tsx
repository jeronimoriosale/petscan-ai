import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Pet } from '@/types';

const PETS_STORAGE_KEY = '@petscan_pets';

export const [PetsProvider, usePets] = createContextHook(() => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPets = useCallback(async () => {
    try {
      console.log('[usePets] Loading pets...');
      const stored = await AsyncStorage.getItem(PETS_STORAGE_KEY);
      console.log('[usePets] Loaded from storage:', stored ? 'data found' : 'no data');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('[usePets] Parsed data:', parsed.length, 'pets');
        setPets(parsed);
      }
    } catch (error) {
      console.error('[usePets] Error loading pets:', error);
    } finally {
      console.log('[usePets] Finished loading, setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const addPet = useCallback(async (pet: Omit<Pet, 'id' | 'createdAt'>) => {
    const newPet: Pet = {
      ...pet,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setPets(currentPets => {
      const updated = [...currentPets, newPet];
      AsyncStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
    return newPet;
  }, []);

  const updatePet = useCallback(async (id: string, updates: Partial<Pet>) => {
    setPets(currentPets => {
      const updated = currentPets.map(p => p.id === id ? { ...p, ...updates } : p);
      AsyncStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const deletePet = useCallback(async (id: string) => {
    setPets(currentPets => {
      const updated = currentPets.filter(p => p.id !== id);
      AsyncStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const getPetById = useCallback((id: string) => {
    return pets.find(p => p.id === id);
  }, [pets]);

  return {
    pets,
    isLoading,
    addPet,
    updatePet,
    deletePet,
    getPetById,
  };
});

export function useSelectedPet(petId: string | undefined) {
  const { getPetById } = usePets();
  return useMemo(() => petId ? getPetById(petId) : undefined, [petId, getPetById]);
}
