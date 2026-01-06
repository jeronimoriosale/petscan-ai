import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
  Camera, 
  Trash2, 
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { usePets } from '@/hooks/usePets';
import { usePetScans } from '@/hooks/useScans';
import Colors from '@/constants/colors';
import { SPECIES_ICONS, SCAN_TYPE_LABELS, UrgencyLevel, ScanResult } from '@/types';

const URGENCY_CONFIG: Record<UrgencyLevel, { color: string; icon: React.ReactNode }> = {
  low: { 
    color: Colors.urgencyLow, 
    icon: <CheckCircle size={14} color={Colors.urgencyLow} />,
  },
  medium: { 
    color: Colors.urgencyMedium, 
    icon: <AlertCircle size={14} color={Colors.urgencyMedium} />,
  },
  high: { 
    color: Colors.urgencyHigh, 
    icon: <AlertTriangle size={14} color={Colors.urgencyHigh} />,
  },
};

function ScanItem({ scan, onPress }: { scan: ScanResult; onPress: () => void }) {
  const urgency = URGENCY_CONFIG[scan.analysis.urgencyLevel];
  const date = new Date(scan.createdAt);

  return (
    <TouchableOpacity style={styles.scanItem} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: scan.imageUri }} style={styles.scanImage} />
      <View style={styles.scanInfo}>
        <View style={styles.scanHeader}>
          <Text style={styles.scanType}>{SCAN_TYPE_LABELS[scan.scanType]}</Text>
          {urgency.icon}
        </View>
        <Text style={styles.scanDate}>
          {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <ChevronRight color={Colors.textMuted} size={18} />
    </TouchableOpacity>
  );
}

export default function PetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPetById, deletePet } = usePets();
  const scans = usePetScans(id);

  const pet = getPetById(id || '');

  if (!pet) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Mascota no encontrada</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Eliminar mascota',
      `¿Estás seguro de que deseas eliminar a ${pet.name}? Se perderá todo el historial de escaneos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deletePet(pet.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleScan = () => {
    router.push('/(tabs)/camera');
  };

  return (
    <>
      <Stack.Screen options={{ title: pet.name }} />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {pet.imageUri ? (
              <Image source={{ uri: pet.imageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>{SPECIES_ICONS[pet.species]}</Text>
              </View>
            )}
          </View>
          <Text style={styles.petName}>{pet.name}</Text>
          {pet.breed && <Text style={styles.petBreed}>{pet.breed}</Text>}
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{pet.age}</Text>
              <Text style={styles.statLabel}>{pet.age === 1 ? 'año' : 'años'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{pet.weight}</Text>
              <Text style={styles.statLabel}>kg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{scans.length}</Text>
              <Text style={styles.statLabel}>escaneos</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
          <Camera color={Colors.surface} size={22} />
          <Text style={styles.scanButtonText}>Nuevo Escaneo</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Escaneos</Text>
          {scans.length === 0 ? (
            <View style={styles.emptyScans}>
              <Text style={styles.emptyScansText}>
                Aún no hay escaneos registrados para {pet.name}
              </Text>
            </View>
          ) : (
            <View style={styles.scansList}>
              {scans.map((scan) => (
                <ScanItem
                  key={scan.id}
                  scan={scan}
                  onPress={() => router.push(`/scan-result?id=${scan.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 color={Colors.error} size={18} />
          <Text style={styles.deleteButtonText}>Eliminar mascota</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 48,
  },
  petName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    marginBottom: 24,
  },
  scanButtonText: {
    color: Colors.surface,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  emptyScans: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyScansText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scansList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  scanImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanType: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  scanDate: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '500' as const,
  },
});
