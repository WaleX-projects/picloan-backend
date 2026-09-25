// SCREEN 9: Sync Queue
import { useCallback, useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { getApplications, updateApplicationStatus } from '../lib/storage';
import { sendtoserver } from '../lib/server';

const PENDING_STATUSES = ['LOCAL', 'UPLOADING', 'PROCESSING', 'FAILED'];

export default function SyncQueueScreen() {
  const [pending, setPending] = useState(getApplications().filter(a => PENDING_STATUSES.includes(a.status)));
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const refresh = () => setPending(getApplications().filter(a => PENDING_STATUSES.includes(a.status)));

  useFocusEffect(useCallback(() => { refresh(); }, []));

  const syncOne = async (id: string) => {
    setSyncingId(id);
    try {
      updateApplicationStatus(id, 'UPLOADING');
      await sendtoserver(id);
      // Full extracted-data handling lives in processing.tsx —
      // here we just kick it off and let the user open the app to see the result.
      router.push(`/processing?id=${id}`);
    } catch {
      updateApplicationStatus(id, 'FAILED');
      refresh();
    } finally {
      setSyncingId(null);
    }
  };

  const syncAll = async () => {
    for (const app of pending) {
      await syncOne(app.id);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sync Queue</Text>
        {pending.length > 0 && (
          <TouchableOpacity style={styles.syncAllButton} onPress={syncAll}>
            <Text style={styles.syncAllText}>Sync Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {pending.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>✓ Everything is synced</Text>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.cardTitle}>Application #{item.id.slice(0, 8)}</Text>
                <Text style={styles.cardStatus}>{item.status}</Text>
              </View>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => syncOne(item.id)}
                disabled={syncingId === item.id}
              >
                <Text style={styles.retryButtonText}>
                  {syncingId === item.id ? 'Syncing...' : 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  syncAllButton: { backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  syncAllText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  listContent: { padding: 16 },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  cardStatus: { fontSize: 12, color: '#f59e0b', fontWeight: '700', marginTop: 4 },
  retryButton: { borderWidth: 1, borderColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  retryButtonText: { color: '#007AFF', fontWeight: '600', fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#16a34a', fontWeight: '600' },
});