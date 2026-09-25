import { File } from 'expo-file-system';
import { getApplicationById, markSynced, updateExtractedData } from '../lib/storage';

export async function sendtoserver(id: string) {
  const data = getApplicationById(id);

  if (!data) {
    throw new Error(`Application ${id} not found`);
  }

  const imageUri = data.local_image_path;

  if (!imageUri) {
    throw new Error('No local image found');
  }

  console.log('Image to upload:', imageUri);

  const file = new File(imageUri);

  const formData = new FormData();
  formData.append('sync_id', id);
  formData.append('files', file as any);

  const response = await fetch(
    'http://10.125.13.37:8000/upload',
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Upload failed: ${response.status} ${errorText}`
    );
  }

 
const result = await response.json();
const sync_url = result.files[0].public_url;
const extracted_data = result.extracted_data.documents;
markSynced(id, sync_url);
updateExtractedData(id,extracted_data);
  console.log('Server response:', result);

  
  return result;
}