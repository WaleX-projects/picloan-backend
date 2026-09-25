// SCREEN 6 ⭐: Extraction Review — turns extracted JSON into an editable form.
// This never shows raw JSON to the user.
import { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getApplicationById, updateExtractedData } from '../../../lib/storage';

function humanize(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Recursively renders a JSON object as sections of editable fields.
// Nested objects become sections; primitive values become text inputs.
function SchemaForm({
  data,
  onChange,
  path = [],
}: {
  data: Record<string, any>;
  onChange: (path: string[], value: string) => void;
  path?: string[];
}) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        const fieldPath = [...path, key];

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionLabel}>{humanize(key)}</Text>
              <SchemaForm data={value} onChange={onChange} path={fieldPath} />
            </View>
          );
        }

        return (
          <View key={key} style={styles.field}>
            <Text style={styles.fieldLabel}>{humanize(key)}</Text>
            <TextInput
              style={styles.input}
              value={String(value ?? '')}
              onChangeText={(text) => onChange(fieldPath, text)}
            />
          </View>
        );
      })}
    </>
  );
}

function setDeep(obj: any, path: string[], value: string) {
  const clone = JSON.parse(JSON.stringify(obj));
  let cursor = clone;
  for (let i = 0; i < path.length - 1; i++) cursor = cursor[path[i]];
  cursor[path[path.length - 1]] = value;
  return clone;
}

export default function ExtractionReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const application = getApplicationById(id);

  const initialData = (() => {
    try {
      const parsed = application?.extracted_data ? JSON.parse(application.extracted_data) : null;
      // TODO: adjust if your backend's extracted_data shape differs from { documents: [...] }
      return parsed?.documents?.[0] ?? {};
    } catch {
      return {};
    }
  })();

  const [formData, setFormData] = useState(initialData);

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Application not found</Text>
      </SafeAreaView>
    );
  }

  const handleChange = (path: string[], value: string) => {
    setFormData((prev: any) => setDeep(prev, path, value));
  };

  const confirmInformation = () => {
    updateExtractedData(id, { documents: [formData] });
    router.push(`/applications/${id}/confirm`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Review Application</Text>
        <Text style={styles.subtitle}>AI extracted the following information from your documents.</Text>

        <SchemaForm data={formData} onChange={handleChange} />

        <TouchableOpacity style={styles.primaryButton} onPress={confirmInformation}>
          <Text style={styles.primaryButtonText}>Confirm Information</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase',
    marginBottom: 10, letterSpacing: 0.5,
  },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, color: '#374151', marginBottom: 4, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 15, color: '#1a1a1a', backgroundColor: '#f9fafb',
  },
  primaryButton: { backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  message: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
});