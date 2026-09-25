// SCREEN 1: Applications (Home)
import { useState, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { getApplications } from '../lib/storage';

const STATUS_FILTERS = ['All', 'LOCAL', 'UPLOADING', 'PROCESSING', 'NEEDS_REVIEW', 'CONFIRMED', 'FAILED'];

const STATUS_COLORS: Record<string, string> = {
  LOCAL: '#9ca3af',
  UPLOADING: '#3b82f6',
  PROCESSING: '#3b82f6',
  NEEDS_REVIEW: '#f59e0b',
  CONFIRMED: '#16a34a',
  SYNCED: '#16a34a',
  FAILED: '#dc2626',
};

type AppRow = ReturnType<typeof getApplications>[number];

export default function Index() {
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [filter, setFilter] = useState('All');

  useFocusEffect(
    useCallback(() => {
      setApplications(getApplications());
    }, [])
  );

  const filtered = filter === 'All' ? applications : applications.filter(a => a.status === filter);

  const getDisplayName = (row: AppRow) => {
    try {
      if (!row.extracted_data) return 'Untitled Application';
      const data = JSON.parse(row.extracted_data);
      
      // TODO: adjust this path to match your actual AI extraction JSON shape
      return (
  data?.[0]?.personal_information?.full_name ||
  'Untitled Application')
    } catch {
      return 'Untitled Application';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PickLoan</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => router.push('/new-application')}>
          <Text style={styles.newButtonText}>+ New Application</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(f) => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Applications Yet</Text>
          <Text style={styles.emptyText}>Tap "New Application" to start capturing a loan form</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/applications/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{getDisplayName(item)}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#9ca3af' }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>{new Date(item.created_at).toLocaleString()}</Text>
            </TouchableOpacity>
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
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  newButton: { backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  newButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6', marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterChipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  cardMeta: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center' },
});

/*

import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState,useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { saveCapturedImage, insertApplication,getApplications } from '../lib/storage';
import {sendtoserver} from '../lib/server';
import * as Crypto from 'expo-crypto';

export default function Index() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);


useEffect(() => {
    getApplications();
    const data = getApplications()
    console.log("__This is the Data from the database:__",data)
  }, []);


  
  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.9,
    });
    setPhotoUri(photo.uri);
    // TODO: this is where you'd hand photo.uri off to your upload/extraction flow
    console.log(photoUri)

  const permanentPath = await saveCapturedImage(photo.uri);
  const id = Crypto.randomUUID(); // or any id generator you're using
  insertApplication(id, permanentPath);
  const data = sendtoserver(id);
    console.log(data)
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
        <View style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 32,
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'white',
  },
});

*/