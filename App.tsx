import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { DocumentList } from './src/components/DocumentList';
import { deleteDocument, getDocumentFileUri, importDocument, loadDocuments } from './src/storage';
import type { MedicalDocument } from './src/types';

export default function App() {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadDocuments()
      .then((docs) => {
        if (!cancelled) {
          setDocuments(docs);
        }
      })
      .catch(() => {
        if (!cancelled) {
          Alert.alert('Error', 'Could not load the list of records.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = useCallback(async () => {
    if (uploading) {
      return;
    }

    setUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      let next = documents;
      const failed: string[] = [];
      for (const asset of result.assets) {
        try {
          next = await importDocument({
            name: asset.name,
            uri: asset.uri,
            mimeType: asset.mimeType,
            size: asset.size,
          });
        } catch {
          failed.push(asset.name);
        }
      }

      setDocuments(next);
      if (failed.length > 0) {
        Alert.alert('Upload failed', failed.join('\n'));
      }
    } catch {
      Alert.alert('Error', 'Could not pick the file.');
    } finally {
      setUploading(false);
    }
  }, [documents, uploading]);

  const handleOpen = useCallback(async (doc: MedicalDocument) => {
    try {
      const file = new File(getDocumentFileUri(doc));
      if (!(await file.canPreview())) {
        Alert.alert('No app to open this file', doc.name);
        return;
      }
      await file.preview();
    } catch {
      Alert.alert('Could not open the file', 'No app on this device can open this format.');
    }
  }, []);

  const handleDelete = useCallback(
    (doc: MedicalDocument) => {
      Alert.alert('Delete this file?', doc.name, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDocuments(await deleteDocument(doc.id));
            } catch {
              Alert.alert('Error', 'Could not delete the file.');
            }
          },
        },
      ]);
    },
    [],
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <Text style={styles.title}>MedAssistant</Text>
          <Text style={styles.subtitle}>
            {documents.length > 0
              ? `Records in the archive: ${documents.length}`
              : 'Medical records archive'}
          </Text>
        </View>

        <DocumentList
          documents={documents}
          loading={loading}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.uploadButton,
              pressed && styles.uploadButtonPressed,
              uploading && styles.uploadButtonDisabled,
            ]}
            onPress={handleUpload}
            disabled={uploading}
            accessibilityRole="button"
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>Upload</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2933',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#66727e',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#f5f7fa',
  },
  uploadButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2f6fed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonPressed: {
    backgroundColor: '#2557c4',
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
