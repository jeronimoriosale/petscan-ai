import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { PawPrint } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página no encontrada' }} />
      <View style={styles.container}>
        <PawPrint color={Colors.textMuted} size={64} />
        <Text style={styles.title}>¡Oops!</Text>
        <Text style={styles.text}>Esta página no existe.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Volver al inicio</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  link: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
});
