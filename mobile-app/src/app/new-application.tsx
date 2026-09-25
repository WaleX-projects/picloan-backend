// SCREEN 2: New Application
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
export default function NewApplicationScreen() {
  const startCapture = () => {
    // A fresh local id for this application. The row itself gets created
    // in storage.ts once the first photo is actually captured.
    const id = Crypto.randomUUID();
    router.push(`/capture?id=${id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>New Loan Application</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Documents</Text>
        <Text style={styles.emptyText}>No documents captured yet</Text>
      </View>

      <TouchableOpacity style={styles.captureButton} onPress={startCapture}>
        <Text style={styles.captureButtonText}>Take Photo</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 24 },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  captureButton: {
    backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 'auto',
  },
  captureButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});