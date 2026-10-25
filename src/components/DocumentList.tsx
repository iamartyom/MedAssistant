import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatFileSize } from '../format';
import type { MedicalDocument } from '../types';

type Props = {
  documents: MedicalDocument[];
  loading: boolean;
  onOpen: (doc: MedicalDocument) => void;
  onDelete: (doc: MedicalDocument) => void;
};

export function DocumentList({ documents, loading, onOpen, onDelete }: Props) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2f6fed" />
      </View>
    );
  }

  if (documents.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No records yet</Text>
        <Text style={styles.emptyHint}>
          Tap &quot;Upload&quot; to add lab results, scans, or doctor&apos;s reports.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={documents}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => onOpen(item)}
        >
          <View style={styles.fileIcon}>
            <Text style={styles.fileIconText}>{getFileBadge(item)}</Text>
          </View>

          <View style={styles.rowBody}>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.rowMeta}>
              {formatFileSize(item.size)} · {formatDate(item.addedAt)}
            </Text>
          </View>

          <Pressable
            hitSlop={8}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
            onPress={() => onDelete(item)}
            accessibilityLabel={`Delete ${item.name}`}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </Pressable>
        </Pressable>
      )}
    />
  );
}

function getFileBadge(doc: MedicalDocument): string {
  if (doc.mimeType.startsWith('image/')) {
    return 'IMG';
  }
  if (doc.mimeType === 'application/pdf' || doc.name.toLowerCase().endsWith('.pdf')) {
    return 'PDF';
  }
  const extension = doc.name.split('.').pop();
  return extension && extension.length <= 4 ? extension.toUpperCase() : 'FILE';
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2933',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    lineHeight: 20,
    color: '#66727e',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  separator: {
    height: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e9ee',
  },
  rowPressed: {
    backgroundColor: '#f5f7fa',
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileIconText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2f6fed',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2933',
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#66727e',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteButtonPressed: {
    backgroundColor: '#fde8e8',
  },
  deleteButtonText: {
    fontSize: 15,
    color: '#c0392b',
  },
});
