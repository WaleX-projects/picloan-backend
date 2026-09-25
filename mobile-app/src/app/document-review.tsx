// SCREEN 4: Document Review
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getApplicationById, updateApplicationStatus } from '../lib/storage';

export default function DocumentReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const application = getApplicationById(id);

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Application not found</Text>
      </SafeAreaView>
    );
  }

  const retake = () => router.push(`/capture?id=${id}`);

  const processApplication = () => {
    updateApplicationStatus(id, 'UPLOADING');
    router.push(`/processing?id=${id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Application #{application.id.slice(0, 8)}</Text>
      <Text style={styles.sectionLabel}>Documents</Text>

      <Image source={{ uri: application.local_image_path }} style={styles.preview} resizeMode="contain" />

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={retake}>
          <Text style={styles.secondaryButtonText}>Add Document</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={processApplication}>
        <Text style={styles.primaryButtonText}>Process Application</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' },
  preview: { width: '100%', height: 300, backgroundColor: '#f3f4f6', borderRadius: 10, marginBottom: 16 },
  actionsRow: { marginBottom: 24 },
  secondaryButton: {
    borderWidth: 1, borderColor: '#007AFF', paddingVertical: 12, borderRadius: 8, alignItems: 'center',
  },
  secondaryButtonText: { color: '#007AFF', fontWeight: '600' },
  primaryButton: {
    backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 'auto',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  message: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
});