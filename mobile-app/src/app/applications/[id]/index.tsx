// SCREEN 8: Application Details
import { View, StyleSheet, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getApplicationById } from '../../../lib/storage';

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function DetailBlock({ data }: { data: Record<string, any> }) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionLabel}>{humanize(key)}</Text>
              <DetailBlock data={value} />
            </View>
          );
        }
        return (
          <View key={key} style={styles.row}>
            <Text style={styles.rowLabel}>{humanize(key)}</Text>
            <Text style={styles.rowValue}>{String(value ?? '—')}</Text>
          </View>
        );
      })}
    </>
  );
}

export default function ApplicationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  console.log(id)
  const application = getApplicationById(id);

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Application not found</Text>
      </SafeAreaView>
    );
  }

  const data = (() => {
    try {
      return JSON.parse(application.extracted_data ?? '{}')?.documents?.[0] ?? {};
    } catch {
      return {};
    }
  })();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Application #{application.id.slice(0, 8)}</Text>
        <Text style={styles.status}>{application.status}</Text>

        <DetailBlock data={data} />

        <Text style={styles.sectionLabel}>Documents</Text>
        <Image source={{ uri: application.local_image_path }} style={styles.image} resizeMode="contain" />

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push(`/applications/${id}/review`)}
        >
          <Text style={styles.secondaryButtonText}>Edit Application</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  status: { fontSize: 13, color: '#16a34a', fontWeight: '700', marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowLabel: { fontSize: 14, color: '#6b7280' },
  rowValue: { fontSize: 14, color: '#1a1a1a', fontWeight: '600' },
  image: { width: '100%', height: 260, backgroundColor: '#f3f4f6', borderRadius: 10, marginTop: 8, marginBottom: 20 },
  secondaryButton: { borderWidth: 1, borderColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#007AFF', fontWeight: '600' },
  message: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
});