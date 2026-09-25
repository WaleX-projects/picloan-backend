// SCREEN 7: Confirmation
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getApplicationById, confirmApplication } from '../../../lib/storage';

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function SummaryBlock({ data }: { data: Record<string, any> }) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionLabel}>{humanize(key)}</Text>
              <SummaryBlock data={value} />
            </View>
          );
        }
        return (
          <Text key={key} style={styles.summaryLine}>
            {humanize(key)}: <Text style={styles.summaryValue}>{String(value ?? '—')}</Text>
          </Text>
        );
      })}
    </>
  );
}

export default function ConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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

  const confirm = () => {
    confirmApplication(id);
    router.replace(`/applications/${id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Confirm Application</Text>
        <SummaryBlock data={data} />

        <Text style={styles.question}>Everything look correct?</Text>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Edit Information</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={confirm}>
          <Text style={styles.primaryButtonText}>Confirm Application</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 },
  summaryLine: { fontSize: 15, color: '#374151', marginBottom: 4 },
  summaryValue: { fontWeight: '600', color: '#1a1a1a' },
  question: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginVertical: 20 },
  secondaryButton: { borderWidth: 1, borderColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  secondaryButtonText: { color: '#007AFF', fontWeight: '600' },
  primaryButton: { backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  message: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
});