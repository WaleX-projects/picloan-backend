// SCREEN 3: Document Capture
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { saveCapturedImage, insertApplication } from '../lib/storage';

export default function CaptureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [saving, setSaving] = useState(false);

  if (!permission) return <View />;

  if (!permission.granted) {
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
    if (!cameraRef.current || saving) return;
    setSaving(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      const permanentPath = await saveCapturedImage(photo.uri);

      // V1: one document per application. Multi-page support would need
      // a separate application_documents table — see note in chat.
      insertApplication(id, permanentPath);

      router.push(`/document-review?id=${id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.frameGuide} pointerEvents="none" />
      </CameraView>
      <Text style={styles.hint}>Make sure all fields are inside the frame</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={saving}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
        <View style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  message: { textAlign: 'center', paddingBottom: 10 },
  camera: { flex: 1 },
  frameGuide: {
    position: 'absolute', top: '15%', left: '8%', right: '8%', bottom: '25%',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 8,
  },
  hint: {
    position: 'absolute', top: '10%', width: '100%', textAlign: 'center',
    color: 'white', fontSize: 13, fontWeight: '600',
  },
  buttonContainer: {
    position: 'absolute', bottom: 64, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', width: '100%', paddingHorizontal: 32,
  },
  button: { flex: 1, alignItems: 'center' },
  text: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  captureButton: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: 'white',
    alignItems: 'center', justifyContent: 'center',
  },
  captureButtonInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'white' },
});