import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, ChevronRight, PawPrint } from 'lucide-react-native';
import { usePets } from '@/hooks/usePets';
import { usePetScans } from '@/hooks/useScans';
import Colors from '@/constants/colors';
import { Pet, SPECIES_ICONS } from '@/types';

function PetCard({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  const scans = usePetScans(pet.id);
  const lastScan = scans[0];
  
  return (
    <TouchableOpacity 
      style={styles.petCard} 
      onPress={onPress}
      activeOpacity={0.7}
      testID={`pet-card-${pet.id}`}
    >
      <View style={styles.petImageContainer}>
        {pet.imageUri ? (
          <Image source={{ uri: pet.imageUri }} style={styles.petImage} />
        ) : (
          <View style={styles.petImagePlaceholder}>
            <Text style={styles.speciesEmoji}>{SPECIES_ICONS[pet.species]}</Text>
          </View>
        )}
      </View>
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petDetails}>
          {pet.age} {pet.age === 1 ? 'año' : 'años'} • {pet.weight}kg
        </Text>
        {lastScan && (
          <Text style={styles.lastScan}>
            Último escaneo: {new Date(lastScan.createdAt).toLocaleDateString('es-ES')}
          </Text>
        )}
      </View>
      <ChevronRight color={Colors.textMuted} size={20} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { pets, isLoading } = usePets();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>¡Hola! 👋</Text>
          <Text style={styles.title}>PetScan AI</Text>
        </View>
        <View style={styles.logoContainer}>
          <PawPrint color={Colors.primary} size={28} />
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis Mascotas</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/add-pet')}
            testID="add-pet-button"
          >
            <Plus color={Colors.surface} size={18} />
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : pets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <PawPrint color={Colors.secondary} size={48} />
            </View>
            <Text style={styles.emptyTitle}>Sin mascotas aún</Text>
            <Text style={styles.emptyText}>
              Agrega tu primera mascota para comenzar a usar el escaneo inteligente
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/add-pet')}
            >
              <Plus color={Colors.surface} size={20} />
              <Text style={styles.emptyButtonText}>Agregar Mascota</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.petsList}>
            {pets.map((pet) => (
              <PetCard 
                key={pet.id} 
                pet={pet} 
                onPress={() => router.push(`/pet-details?id=${pet.id}`)}
              />
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Consejo</Text>
          <Text style={styles.infoText}>
            Escanea regularmente las zonas de interés de tu mascota para detectar 
            cambios a tiempo y mantener un historial de evolución.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyButtonText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  petsList: {
    gap: 12,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  petImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 14,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speciesEmoji: {
    fontSize: 28,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  petDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  lastScan: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: Colors.secondaryLight + '15',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.secondaryDark,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
