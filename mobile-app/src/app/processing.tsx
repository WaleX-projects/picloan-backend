// SCREEN 5: Sync / Processing
import { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { sendtoserver } from '../lib/server';
import { markSynced, updateExtractedData, updateApplicationStatus } from '../lib/storage';

type Step = 'uploading' | 'extracting' | 'done' | 'offline' | 'error';

export default function ProcessingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [step, setStep] = useState<Step>('uploading');
  const [errorMessage, setErrorMessage] = useState('');

  const run = async () => {
    setStep('uploading');
    try {
      setStep('extracting');
      const result = await sendtoserver(id);

      markSynced(id, result.files?.[0]?.public_url ?? '');
      updateExtractedData(id, result.extracted_data);
      updateApplicationStatus(id, result.status === 'SUCCESS' ? 'NEEDS_REVIEW' : 'FAILED');

      setStep('done');
      router.replace(`/applications/${id}/review`);
    } catch (err: any) {
      const isNetworkError = err?.message?.includes('Network request failed');
      if (isNetworkError) {
        setStep('offline');
      } else {
        setErrorMessage(err?.message ?? 'Unknown error');
        setStep('error');
        updateApplicationStatus(id, 'FAILED');
      }
    }
  };

  useEffect(() => {
    run();
  }, []);

  if (step === 'offline') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>No internet connection</Text>
        <Text style={styles.message}>
          Your application has been saved on this device. It will automatically sync when you're back online.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/')}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (step === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{errorMessage}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={run}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Processing Application</Text>
      <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 24 }} />
      <Text style={styles.step}>✓ Application saved locally</Text>
      <Text style={styles.step}>{step === 'uploading' ? '●' : '✓'} Uploading documents...</Text>
      <Text style={styles.step}>{step === 'extracting' ? '●' : ' '} AI is reading your documents...</Text>
      <Text style={styles.note}>This may take a few seconds.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  step: { fontSize: 15, color: '#374151', marginBottom: 8 },
  note: { fontSize: 13, color: '#9ca3af', marginTop: 12, textAlign: 'center' },
  message: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginVertical: 16 },
  primaryButton: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});