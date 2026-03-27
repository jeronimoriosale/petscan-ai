import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePets } from '@/hooks/usePets';
import Colors from '@/constants/colors';
import { Species, SPECIES_LABELS, SPECIES_ICONS } from '@/types';

const SPECIES_OPTIONS: Species[] = ['dog', 'cat', 'bird', 'rabbit', 'other'];

export default function AddPetScreen() {
  const router = useRouter();
  const { addPet } = usePets();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!age || isNaN(Number(age))) {
      Alert.alert('Error', 'Ingresa una edad válida');
      return;
    }
    if (!weight || isNaN(Number(weight))) {
      Alert.alert('Error', 'Ingresa un peso válido');
      return;
    }

    setIsSubmitting(true);
    try {
      await addPet({
        name: name.trim(),
        species,
        breed: breed.trim() || undefined,
        age: Number(age),
        weight: Number(weight),
      });
      router.back();
    } catch (error) {
      console.log('Error adding pet:', error);
      Alert.alert('Error', 'No se pudo agregar la mascota');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Max"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Especie *</Text>
          <View style={styles.speciesContainer}>
            {SPECIES_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.speciesButton,
                  species === s && styles.speciesButtonActive,
                ]}
                onPress={() => setSpecies(s)}
              >
                <Text style={styles.speciesEmoji}>{SPECIES_ICONS[s]}</Text>
                <Text
                  style={[
                    styles.speciesText,
                    species === s && styles.speciesTextActive,
                  ]}
                >
                  {SPECIES_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Raza (opcional)</Text>
          <TextInput
            style={styles.input}
            value={breed}
            onChangeText={setBreed}
            placeholder="Ej: Labrador"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfSection]}>
            <Text style={styles.label}>Edad (años) *</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.section, styles.halfSection]}>
            <Text style={styles.label}>Peso (kg) *</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Guardando...' : 'Agregar Mascota'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  speciesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  speciesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 6,
  },
  speciesButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '15',
  },
  speciesEmoji: {
    fontSize: 18,
  },
  speciesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  speciesTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfSection: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
