import React, { useMemo } from 'react';
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
import { Clock, ChevronRight, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useScans } from '@/hooks/useScans';
import { usePets } from '@/hooks/usePets';
import Colors from '@/constants/colors';
import { ScanResult, SCAN_TYPE_LABELS, UrgencyLevel } from '@/types';

const URGENCY_CONFIG: Record<UrgencyLevel, { color: string; icon: React.ReactNode; label: string }> = {
  low: { 
    color: Colors.urgencyLow, 
    icon: <CheckCircle size={16} color={Colors.urgencyLow} />,
    label: 'Bajo' 
  },
  medium: { 
    color: Colors.urgencyMedium, 
    icon: <AlertCircle size={16} color={Colors.urgencyMedium} />,
    label: 'Medio' 
  },
  high: { 
    color: Colors.urgencyHigh, 
    icon: <AlertTriangle size={16} color={Colors.urgencyHigh} />,
    label: 'Alto' 
  },
};

function ScanCard({ scan, petName, onPress }: { scan: ScanResult; petName: string; onPress: () => void }) {
  const urgency = URGENCY_CONFIG[scan.analysis.urgencyLevel];
  const date = new Date(scan.createdAt);
  
  return (
    <TouchableOpacity 
      style={styles.scanCard} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: scan.imageUri }} style={styles.scanImage} />
      <View style={styles.scanInfo}>
        <View style={styles.scanHeader}>
          <Text style={styles.scanType}>{SCAN_TYPE_LABELS[scan.scanType]}</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: urgency.color + '20' }]}>
            {urgency.icon}
            <Text style={[styles.urgencyText, { color: urgency.color }]}>
              {urgency.label}
            </Text>
          </View>
        </View>
        <Text style={styles.petName}>{petName}</Text>
        <Text style={styles.scanDate}>
          {date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
      <ChevronRight color={Colors.textMuted} size={20} />
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { scans } = useScans();
  const { getPetById } = usePets();

  const groupedScans = useMemo(() => {
    const groups: { [key: string]: ScanResult[] } = {};
    
    scans.forEach(scan => {
      const date = new Date(scan.createdAt).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(scan);
    });

    return Object.entries(groups);
  }, [scans]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Todos los escaneos realizados</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {scans.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Clock color={Colors.secondary} size={48} />
            </View>
            <Text style={styles.emptyTitle}>Sin historial</Text>
            <Text style={styles.emptyText}>
              Los escaneos que realices aparecerán aquí para que puedas revisar la evolución de tu mascota
            </Text>
          </View>
        ) : (
          groupedScans.map(([date, dateScans]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {dateScans.map((scan) => {
                const pet = getPetById(scan.petId);
                return (
                  <ScanCard
                    key={scan.id}
                    scan={scan}
                    petName={pet?.name || 'Mascota eliminada'}
                    onPress={() => router.push(`/scan-result?id=${scan.id}`)}
                  />
                );
              })}
            </View>
          ))
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
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
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  scanImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scanType: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  petName: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  scanDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
