import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  MapPin,
  ChevronRight,
  Stethoscope,
  Home,
  FileText,
} from 'lucide-react-native';
import { useScans } from '@/hooks/useScans';
import { usePets } from '@/hooks/usePets';
import Colors from '@/constants/colors';
import { SCAN_TYPE_LABELS, UrgencyLevel } from '@/types';

const URGENCY_CONFIG: Record<UrgencyLevel, { 
  color: string; 
  bgColor: string;
  icon: React.ReactNode; 
  label: string;
  message: string;
}> = {
  low: { 
    color: Colors.urgencyLow, 
    bgColor: Colors.urgencyLow + '15',
    icon: <CheckCircle size={24} color={Colors.urgencyLow} />,
    label: 'Observación',
    message: 'Puede monitorearse en casa. Vigila la evolución.',
  },
  medium: { 
    color: Colors.urgencyMedium, 
    bgColor: Colors.urgencyMedium + '15',
    icon: <AlertCircle size={24} color={Colors.urgencyMedium} />,
    label: 'Agendar Cita Pronto',
    message: 'Se recomienda consultar con un veterinario en los próximos días.',
  },
  high: { 
    color: Colors.urgencyHigh, 
    bgColor: Colors.urgencyHigh + '15',
    icon: <AlertTriangle size={24} color={Colors.urgencyHigh} />,
    label: 'Atención Inmediata',
    message: 'Requiere atención veterinaria urgente.',
  },
};

export default function ScanResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getScanById } = useScans();
  const { getPetById } = usePets();

  const scan = getScanById(id || '');
  const pet = scan ? getPetById(scan.petId) : null;

  if (!scan) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Escaneo no encontrado</Text>
      </View>
    );
  }

  const urgency = URGENCY_CONFIG[scan.analysis.urgencyLevel];

  const handleFindVets = () => {
    const query = encodeURIComponent('veterinario cerca de mí');
    const url = Platform.select({
      ios: `maps://maps.apple.com/?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/${query}`,
    });
    Linking.openURL(url);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: scan.imageUri }} style={styles.image} />
        <View style={styles.scanTypeOverlay}>
          <Text style={styles.scanTypeText}>{SCAN_TYPE_LABELS[scan.scanType]}</Text>
        </View>
      </View>

      {pet && (
        <Text style={styles.petName}>{pet.name}</Text>
      )}

      <View style={[styles.urgencyCard, { backgroundColor: urgency.bgColor }]}>
        <View style={styles.urgencyHeader}>
          {urgency.icon}
          <Text style={[styles.urgencyLabel, { color: urgency.color }]}>
            {urgency.label}
          </Text>
        </View>
        <Text style={styles.urgencyMessage}>{urgency.message}</Text>
      </View>

      {scan.analysis.urgencyLevel === 'high' && (
        <TouchableOpacity style={styles.vetButton} onPress={handleFindVets}>
          <MapPin color={Colors.surface} size={20} />
          <Text style={styles.vetButtonText}>Veterinarios cerca de mí</Text>
          <ChevronRight color={Colors.surface} size={20} />
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileText color={Colors.primary} size={20} />
          <Text style={styles.sectionTitle}>Análisis Visual</Text>
        </View>
        <Text style={styles.description}>{scan.analysis.visualAnalysis}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Stethoscope color={Colors.primary} size={20} />
          <Text style={styles.sectionTitle}>Compatibilidad con Condiciones</Text>
        </View>
        {scan.analysis.compatibility.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.bullet} />
            <View style={styles.compatibilityItem}>
              <Text style={styles.listText}>{item.condition}</Text>
              {item.probability !== undefined && (
                <View style={styles.probabilityBadge}>
                  <Text style={styles.probabilityText}>{item.probability}%</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Home color={Colors.secondary} size={20} />
          <Text style={styles.sectionTitle}>Guía de Cuidado</Text>
        </View>
        {scan.analysis.careGuide.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.disclaimerCard}>
        <AlertCircle color={Colors.textMuted} size={18} />
        <Text style={styles.disclaimerText}>{scan.analysis.disclaimer}</Text>
      </View>

      <Text style={styles.dateText}>
        Escaneo realizado el {new Date(scan.createdAt).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </ScrollView>
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
  imageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  scanTypeOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scanTypeText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  petName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  urgencyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  urgencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  urgencyLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  urgencyMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  vetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.urgencyHigh,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  vetButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  compatibilityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  probabilityBadge: {
    backgroundColor: Colors.primaryLight + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  probabilityText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
