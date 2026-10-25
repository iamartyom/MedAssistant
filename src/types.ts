export type MedicalDocument = {
  /** Stable random id, also the name of the stored file on disk. */
  id: string;
  /** Original file name shown to the user. */
  name: string;
  /** MIME type reported by the picker (may be empty). */
  mimeType: string;
  /** Size in bytes. */
  size: number;
  /** File name inside the app documents directory. */
  storedName: string;
  /** ISO timestamp of when the document was added. */
  addedAt: string;
};
