import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, ImageIcon, Sparkles, Eye, Smile, Bandage, Activity, ChevronDown } from 'lucide-react-native';
import { usePets } from '@/hooks/usePets';
import { useScans } from '@/hooks/useScans';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import Colors from '@/constants/colors';
import { ScanType, SCAN_TYPE_LABELS, Pet, AnalysisResult } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GUIDE_SIZE = SCREEN_WIDTH * 0.7;

const SCAN_TYPES: { type: ScanType; icon: React.ReactNode; label: string }[] = [
  { type: 'skin', icon: <Sparkles size={20} color={Colors.surface} />, label: 'Piel/Pelaje' },
  { type: 'eyes', icon: <Eye size={20} color={Colors.surface} />, label: 'Ojos/Oídos' },
  { type: 'teeth', icon: <Smile size={20} color={Colors.surface} />, label: 'Dientes' },
  { type: 'wound', icon: <Bandage size={20} color={Colors.surface} />, label: 'Herida' },
  { type: 'posture', icon: <Activity size={20} color={Colors.surface} />, label: 'Postura' },
];

const analysisSchema = z.object({
  visualAnalysis: z.string().describe('Descripción objetiva de lo que se observa en la imagen, sin usar palabras como diagnóstico, curar o recetar'),
  compatibility: z.array(z.object({
    condition: z.string().describe('Nombre de la condición común con la que es compatible'),
    probability: z.number().optional().describe('Porcentaje de compatibilidad (0-100) si es posible determinarlo'),
  })).describe('Lista de 2-4 condiciones comunes con las que los hallazgos son compatibles'),
  urgencyLevel: z.enum(['low', 'medium', 'high']).describe('Nivel de urgencia: low (Observación), medium (Agendar cita pronto), high (Atención inmediata)'),
  urgencyClassification: z.string().describe('Texto descriptivo del nivel de urgencia: [BAJA - Observación], [MEDIA - Agendar cita pronto], o [ALTA - Atención inmediata]'),
  careGuide: z.array(z.string()).describe('Lista de 2-4 sugerencias básicas de cuidado que NO involucren medicamentos de venta bajo receta'),
  disclaimer: z.string().describe('Descargo de responsabilidad: "Este análisis es una guía informativa y no reemplaza la consulta veterinaria profesional."'),
});

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedScanType, setSelectedScanType] = useState<ScanType>('skin');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showPetPicker, setShowPetPicker] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { pets } = usePets();
  const { addScan } = useScans();

  useEffect(() => {
    if (pets.length > 0 && !selectedPet) {
      setSelectedPet(pets[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pets]);

  const handleCapture = async () => {
    if (!selectedPet) {
      Alert.alert('Selecciona una mascota', 'Debes seleccionar una mascota antes de escanear.');
      return;
    }

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });
        if (photo?.uri) {
          setCapturedImage(photo.uri);
          await analyzeImage(photo.uri, photo.base64 || '');
        }
      } catch (error) {
        console.log('Error capturing photo:', error);
        Alert.alert('Error', 'No se pudo capturar la foto');
      }
    }
  };

  const handlePickImage = async () => {
    if (!selectedPet) {
      Alert.alert('Selecciona una mascota', 'Debes seleccionar una mascota antes de escanear.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setCapturedImage(asset.uri);
      await analyzeImage(asset.uri, asset.base64 || '');
    }
  };

  const analyzeImage = async (imageUri: string, base64: string) => {
    if (!selectedPet) return;

    setIsAnalyzing(true);
    try {
      console.log('[Camera] Starting AI analysis for:', selectedScanType);
      console.log('[Camera] Toolkit URL:', process.env.EXPO_PUBLIC_TOOLKIT_URL);
      console.log('[Camera] Image size (base64):', base64?.length || 0);
      
      const systemPrompt = `Eres un Asistente de Triaje Veterinario basado en IA. Tu tono debe ser empático, profesional y precavido.

RESTRICCIONES CRÍTICAS:
- PROHIBIDO usar: 'diagnóstico', 'recetar', 'curar' o asegurar que el animal 'tiene' una enfermedad definitivamente
- SOLO describe lo que observas objetivamente
- SOLO indica compatibilidad con condiciones comunes
- NUNCA sugieras medicamentos de venta bajo receta

Analiza la imagen de una mascota (${selectedPet.species}) enfocada en: ${SCAN_TYPE_LABELS[selectedScanType]}

Proporciona:
1. **Análisis Visual**: Describe objetivamente lo que ves (ej: 'Se observa una zona con pérdida de pelaje y enrojecimiento')
2. **Compatibilidad**: Indica con qué condiciones comunes son compatibles estos hallazgos (ej: 'Estos signos son frecuentemente compatibles con dermatitis alérgica'). Incluye porcentaje de probabilidad si es posible.
3. **Nivel de Urgencia**:
   - low: [BAJA - Observación] - puede monitorearse en casa
   - medium: [MEDIA - Agendar cita pronto] - consultar veterinario en días
   - high: [ALTA - Atención inmediata] - requiere atención urgente
4. **Guía de Cuidado**: Sugerencias básicas (limpieza, evitar que se lama, etc.) SIN medicamentos de prescripción

LÓGICA DE CASOS GRAVES:
Si detectas signos de riesgo vital (sangrado profuso, dificultad respiratoria, encías blancas, convulsiones, trauma severo):
- urgencyLevel DEBE ser 'high'
- El primer consejo DEBE ser: 'Diríjase a la clínica de urgencias veterinarias más cercana de inmediato'

Disclaimer obligatorio: 'Este análisis es una guía informativa y no reemplaza la consulta veterinaria profesional.'`;

      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              { type: 'image', image: `data:image/jpeg;base64,${base64}` },
            ],
          },
        ],
        schema: analysisSchema,
      });

      console.log('[Camera] Analysis completed successfully');
      console.log('[Camera] Analysis result:', JSON.stringify(result, null, 2));

      const analysisResult: AnalysisResult = {
        visualAnalysis: result.visualAnalysis,
        compatibility: result.compatibility,
        urgencyLevel: result.urgencyLevel,
        urgencyClassification: result.urgencyClassification,
        careGuide: result.careGuide,
        disclaimer: result.disclaimer,
      };

      const newScan = await addScan({
        petId: selectedPet.id,
        scanType: selectedScanType,
        imageUri: imageUri,
        analysis: analysisResult,
      });

      console.log('[Camera] Navigating to scan result:', newScan.id);
      router.push(`/scan-result?id=${newScan.id}`);
    } catch (error) {
      console.error('[Camera] Error analyzing image:', error);
      console.error('[Camera] Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Error de Análisis',
        'No se pudo analizar la imagen. Verifica tu conexión a internet e intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
      setCapturedImage(null);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Camera color={Colors.primary} size={64} />
          <Text style={styles.permissionTitle}>Acceso a la cámara</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a tu cámara para poder escanear a tu mascota
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Permitir acceso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (pets.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Camera color={Colors.primary} size={64} />
          <Text style={styles.permissionTitle}>Agrega una mascota</Text>
          <Text style={styles.permissionText}>
            Primero debes agregar una mascota para poder realizar escaneos
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={() => router.push('/add-pet')}
          >
            <Text style={styles.permissionButtonText}>Agregar Mascota</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {isAnalyzing ? (
        <View style={styles.analyzingContainer}>
          <View style={styles.analyzingContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.analyzingTitle}>Analizando imagen...</Text>
            <Text style={styles.analyzingText}>
              Nuestra IA está evaluando la zona de {SCAN_TYPE_LABELS[selectedScanType]}
            </Text>
          </View>
        </View>
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            <SafeAreaView style={styles.cameraOverlay} edges={['top']}>
              <TouchableOpacity
                style={styles.petSelector}
                onPress={() => setShowPetPicker(!showPetPicker)}
              >
                <Text style={styles.petSelectorText}>
                  {selectedPet?.name || 'Seleccionar mascota'}
                </Text>
                <ChevronDown color={Colors.surface} size={18} />
              </TouchableOpacity>

              {showPetPicker && (
                <View style={styles.petPickerDropdown}>
                  {pets.map((pet) => (
                    <TouchableOpacity
                      key={pet.id}
                      style={[
                        styles.petPickerItem,
                        selectedPet?.id === pet.id && styles.petPickerItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedPet(pet);
                        setShowPetPicker(false);
                      }}
                    >
                      <Text style={styles.petPickerItemText}>{pet.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.guideContainer}>
                <View style={styles.guideCircle}>
                  <View style={styles.guideCornerTL} />
                  <View style={styles.guideCornerTR} />
                  <View style={styles.guideCornerBL} />
                  <View style={styles.guideCornerBR} />
                </View>
                <Text style={styles.guideText}>
                  Enfoca la zona de {SCAN_TYPE_LABELS[selectedScanType]}
                </Text>
              </View>
            </SafeAreaView>
          </CameraView>

          <SafeAreaView style={styles.controls} edges={['bottom']}>
            <Text style={styles.scanTypeLabel}>¿Qué estamos escaneando?</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scanTypesContainer}
            >
              {SCAN_TYPES.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.scanTypeButton,
                    selectedScanType === item.type && styles.scanTypeButtonActive,
                  ]}
                  onPress={() => setSelectedScanType(item.type)}
                >
                  {item.icon}
                  <Text
                    style={[
                      styles.scanTypeText,
                      selectedScanType === item.type && styles.scanTypeTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.captureContainer}>
              <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
                <ImageIcon color={Colors.text} size={24} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={styles.placeholder} />
            </View>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.text,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  petSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  petSelectorText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  petPickerDropdown: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  petPickerItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  petPickerItemSelected: {
    backgroundColor: Colors.primaryLight + '20',
  },
  petPickerItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCircle: {
    width: GUIDE_SIZE,
    height: GUIDE_SIZE,
    borderRadius: GUIDE_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
    position: 'relative',
  },
  guideCornerTL: {
    position: 'absolute',
    top: -2,
    left: GUIDE_SIZE * 0.15,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.secondary,
    borderTopLeftRadius: 15,
  },
  guideCornerTR: {
    position: 'absolute',
    top: -2,
    right: GUIDE_SIZE * 0.15,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.secondary,
    borderTopRightRadius: 15,
  },
  guideCornerBL: {
    position: 'absolute',
    bottom: -2,
    left: GUIDE_SIZE * 0.15,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.secondary,
    borderBottomLeftRadius: 15,
  },
  guideCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: GUIDE_SIZE * 0.15,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.secondary,
    borderBottomRightRadius: 15,
  },
  guideText: {
    color: Colors.surface,
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controls: {
    backgroundColor: Colors.surface,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  scanTypeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  scanTypesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  scanTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
  },
  scanTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  scanTypeText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  scanTypeTextActive: {
    fontWeight: '600' as const,
  },
  captureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primaryLight,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
  },
  placeholder: {
    width: 50,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  analyzingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingContent: {
    alignItems: 'center',
    padding: 32,
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  analyzingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
