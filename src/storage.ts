import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import type { MedicalDocument } from './types';

const DOCUMENTS_DIR_NAME = 'medical-documents';
const INDEX_FILE_NAME = 'documents.json';

function getDocumentsDir(): Directory {
  const dir = new Directory(Paths.document, DOCUMENTS_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

function getIndexFile(): File {
  return new File(getDocumentsDir(), INDEX_FILE_NAME);
}

/** Path to a stored copy of the document, readable by the app. */
export function getDocumentFileUri(doc: MedicalDocument): string {
  return new File(getDocumentsDir(), doc.storedName).uri;
}

/** Reads the document index from disk. Returns an empty list on first run. */
export async function loadDocuments(): Promise<MedicalDocument[]> {
  const index = getIndexFile();
  if (!index.exists) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(await index.text());
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isMedicalDocument);
  } catch {
    // A corrupted index should not brick the app; start from scratch.
    return [];
  }
}

async function saveDocuments(docs: MedicalDocument[]): Promise<void> {
  const index = getIndexFile();
  if (!index.exists) {
    index.create({ overwrite: true });
  }
  await index.write(JSON.stringify(docs));
}

/**
 * Copies a picked file into the app's documents directory and prepends it to
 * the index. Files picked via the system picker live in a temporary cache, so
 * they must be copied to survive app restarts.
 */
export async function importDocument(input: {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
}): Promise<MedicalDocument[]> {
  const id = randomUUID();
  const extension = getExtension(input.name);
  const storedName = `${id}${extension}`;

  const source = new File(input.uri);
  await source.copy(new File(getDocumentsDir(), storedName), { overwrite: true });

  const stored = new File(getDocumentsDir(), storedName);
  const doc: MedicalDocument = {
    id,
    name: input.name,
    mimeType: input.mimeType ?? '',
    size: input.size ?? (stored.exists ? stored.size : 0),
    storedName,
    addedAt: new Date().toISOString(),
  };

  const docs = [doc, ...(await loadDocuments())];
  await saveDocuments(docs);
  return docs;
}

/** Removes a document from the index and deletes its stored copy. */
export async function deleteDocument(id: string): Promise<MedicalDocument[]> {
  const docs = await loadDocuments();
  const target = docs.find((doc) => doc.id === id);
  const remaining = docs.filter((doc) => doc.id !== id);

  if (target) {
    const file = new File(getDocumentsDir(), target.storedName);
    if (file.exists) {
      file.delete();
    }
  }

  await saveDocuments(remaining);
  return remaining;
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) {
    return '';
  }
  return name.slice(dot);
}

function isMedicalDocument(value: unknown): value is MedicalDocument {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const doc = value as Record<string, unknown>;
  return (
    typeof doc.id === 'string' &&
    typeof doc.name === 'string' &&
    typeof doc.storedName === 'string' &&
    typeof doc.addedAt === 'string' &&
    typeof doc.mimeType === 'string' &&
    typeof doc.size === 'number'
  );
}
