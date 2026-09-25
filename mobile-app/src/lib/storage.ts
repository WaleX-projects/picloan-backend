import { File, Directory, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('loanapp.db');

// Run once at app startup
export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      local_image_path TEXT NOT NULL,
      sync_image_path TEXT,
      extracted_data TEXT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'LOCAL',
      updated_at TEXT NOT NULL
    );
  `);
}

// Run this immediately when the module is first imported — guarantees the
// table exists before ANY other function in this file can be called,
// regardless of React's child-before-parent useEffect firing order.
initDatabase();

// Call this right after cameraRef.current.takePictureAsync()
// Returns the permanent file's uri — that's what you store in SQLite.
export async function saveCapturedImage(tempUri: string): Promise<string> {
  const scansDir = new Directory(Paths.document, 'scans');
  if (!scansDir.exists) {
    console.log("_______save1______")
    scansDir.create({ intermediates: true });
  }

  const capturedFile = new File(tempUri);
  const filename = `scan_${Date.now()}.jpg`;

  // Move out of the temp camera cache into our permanent folder,
  // then give it a stable, predictable name.
  await capturedFile.move(scansDir);
  capturedFile.rename(filename);
  console.log("_______save1______", capturedFile.uri)
  return capturedFile.uri; // now points at documentDirectory/scans/scan_<timestamp>.jpg
}

// Insert a new application row pointing at the saved image
export function insertApplication(id: string, imagePath: string) {
  db.runSync(
    `INSERT INTO applications (
      id,
      local_image_path,
      created_at,
      status,
      updated_at
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      imagePath,
      new Date().toISOString(),
      'LOCAL',
      new Date().toISOString()
    ]
  );
}

// Fetch all applications (for your list screen)
export function getApplications() {
  return db.getAllSync<{
    id: string;
    local_image_path: string;
    sync_image_path: string | null;
    extracted_data: string | null;
    created_at: string;
    status: string;
    updated_at: string;
  }>(
    `SELECT * FROM applications ORDER BY created_at DESC`
  );
}

// Fetch data with id
export function getApplicationById(id: string) {
  return db.getFirstSync<{
    id: string;
    local_image_path: string;
    sync_image_path: string | null;
    extracted_data: string | null;
    created_at: string;
    status: string;
    updated_at: string;
  }>(
    `SELECT * FROM applications WHERE id = ?`,
    [id]
  );
}

// Update just the status of one application
export function updateApplicationStatus(id: string, status: string) {
  db.runSync(
    `UPDATE applications SET status = ?, updated_at = ? WHERE id = ?`,
    [status, new Date().toISOString(), id]
  );
}

// Mark an application as reviewed and confirmed by the officer
export function confirmApplication(id: string) {
  db.runSync(
    `UPDATE applications SET status = ?, updated_at = ? WHERE id = ?`,
    ['CONFIRMED', new Date().toISOString(), id]
  );
}

// Update status + the server's sync image path after a successful upload
export function markSynced(id: string, syncImagePath: string) {
  db.runSync(
    `UPDATE applications
     SET status = ?, sync_image_path = ?, updated_at = ?
     WHERE id = ?`,
    ['SYNCED', syncImagePath, new Date().toISOString(), id]
  );
}

// Update the extracted AI data once it comes back from the server
export function updateExtractedData(id: string, extractedData: object) {
  db.runSync(
    `UPDATE applications SET extracted_data = ?, updated_at = ? WHERE id = ?`,
    [JSON.stringify(extractedData), new Date().toISOString(), id]
  );
}

// Read the raw bytes off disk when you're ready to upload — don't store
// these in SQLite, just read them at the moment you need them.
export async function getImageBytes(imagePath: string): Promise<Uint8Array> {
  const file = new File(imagePath);
  return file.bytes();
}

// If your upload endpoint wants base64 instead of raw bytes:
export function getImageBase64(imagePath: string): string {
  const file = new File(imagePath);
  return file.base64Sync();
}

// Reset data for now one
export function resetDatabase() {
  db.execSync(`
    DROP TABLE IF EXISTS applications;
  `);

  initDatabase();
}