import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, FlatList, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { FileText, Calendar, ChevronRight, Search, Trash2 } from 'lucide-react-native';
import { getThemeColors } from '../lib/theme';
import { deleteUserScan, deleteAllUserScans } from '../lib/supabaseService';
import FloatingAIBubble from '../components/FloatingAIBubble';

export default function HistoryScreen({ navigation }: any) {
  const { scans, bookmarkedProductIds, clearHistory, removeScan, restoreScans, supabaseUserId, theme } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'saved'>('all');

  const colors = getThemeColors(theme);
  const styles = getStyles(colors);

  const filteredScans = scans.filter(scan => {
    // If filtering to saved scans, verify the scan ID is in bookmarkedProductIds list
    if (filterMode === 'saved' && !bookmarkedProductIds.includes(scan.id)) {
      return false;
    }
    const name = scan.product?.name || '';
    const brand = scan.product?.brand || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || brand.toLowerCase().includes(query);
  });

  const getVerdictColor = (verdict?: string) => {
    switch (verdict?.toLowerCase()) {
      case 'safe': return '#10b981'; // safe green
      case 'caution': return '#f59e0b'; // caution yellow
      case 'hazardous':
      case 'avoid':
        return '#ef4444'; // hazardous red
      default: return '#64748b';
    }
  };

  const getScoreEmoji = (verdict?: string) => {
    switch (verdict?.toLowerCase()) {
      case 'safe': return '🟢';
      case 'caution': return '🟡';
      case 'hazardous':
      case 'avoid':
        return '🔴';
      default: return '⚪';
    }
  };

  const handleDeleteScan = (scanId: string) => {
    Alert.alert(
      "Delete Scan",
      "Are you sure you want to delete this scan from your history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            const previousScans = [...scans];
            removeScan(scanId);
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scanId);
            if (supabaseUserId && isUuid) {
              try {
                const success = await deleteUserScan(scanId, supabaseUserId);
                if (!success) {
                  restoreScans(previousScans);
                  Alert.alert("Error", "Failed to delete scan from cloud.");
                }
              } catch (e) {
                restoreScans(previousScans);
                Alert.alert("Error", "An error occurred while deleting.");
              }
            }
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to permanently delete all scan history? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            const previousScans = [...scans];
            clearHistory();
            if (supabaseUserId) {
              try {
                const success = await deleteAllUserScans(supabaseUserId);
                if (!success) {
                  restoreScans(previousScans);
                  Alert.alert("Error", "Failed to clear history from cloud.");
                }
              } catch (e) {
                restoreScans(previousScans);
                Alert.alert("Error", "An error occurred while clearing history.");
              }
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const verdictColor = getVerdictColor(item.verdict);
    const scoreEmoji = getScoreEmoji(item.verdict);
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('Result', { data: item })}
        style={styles.itemCard}
      >
        <View style={styles.itemInfo}>
          <View style={styles.iconBadge}>
            {item.product?.imageUrl ? (
              <Image source={{ uri: item.product.imageUrl }} style={styles.productThumbnail} />
            ) : (
              <FileText color="#14b8a6" size={20} />
            )}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.product?.name || 'Scanned Product'}
            </Text>
            <Text style={styles.itemSubtitle} numberOfLines={1}>
              {item.product?.brand || 'Unknown Brand'}
            </Text>
            <View style={styles.dateRow}>
              <Calendar color={colors.textSecondary} size={10} />
              <Text style={styles.dateText}>
                {new Date(item.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rightContent}>
          <View style={styles.scoreVerdictContainer}>
            <Text style={[styles.scoreText, { color: verdictColor }]}>
              {item.score}/100 {scoreEmoji}
            </Text>
            <View style={[styles.verdictBadge, { backgroundColor: `${verdictColor}1A`, borderColor: `${verdictColor}33` }]}>
              <Text style={[styles.verdictText, { color: verdictColor }]}>{item.verdict}</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => handleDeleteScan(item.id)}
            style={styles.deleteBtn}
          >
            <Trash2 color="#ef4444" size={16} />
          </TouchableOpacity>
          <ChevronRight color={colors.textSecondary} size={16} style={styles.chevron} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background glow */}
      {theme === 'dark' && <View style={styles.glowTop} />}

      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Scan History</Text>
        {scans.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
            <Trash2 color="#ef4444" size={20} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Search color={colors.textSecondary} size={18} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search scans..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, filterMode === 'all' && styles.tabButtonActive, { borderColor: colors.border }]}
          onPress={() => setFilterMode('all')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, filterMode === 'all' ? styles.tabTextActive : { color: colors.textSecondary }]}>
            All Scans
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, filterMode === 'saved' && styles.tabButtonActive, { borderColor: colors.border }]}
          onPress={() => setFilterMode('saved')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, filterMode === 'saved' ? styles.tabTextActive : { color: colors.textSecondary }]}>
            Saved Reports
          </Text>
        </TouchableOpacity>
      </View>
      
      {filteredScans.length === 0 ? (
        <View style={styles.centered}>
          <FileText color={colors.textSecondary} size={48} />
          <Text style={styles.emptyTitle}>
            {filterMode === 'saved' ? "No saved reports yet" : "No scans found"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filterMode === 'saved'
              ? "Bookmark/save reports from the health analysis screen to view them here"
              : (searchQuery ? "Try a different search query" : "Your analyzed labels will show up here")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredScans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
      <FloatingAIBubble />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 280,
    height: 280,
    backgroundColor: '#06b6d4',
    borderRadius: 140,
    opacity: 0.05,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  clearAllBtn: {
    padding: 8,
    backgroundColor: colors.isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.1,
    marginRight: 8,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.isDark ? '#080914' : '#f5f6fa',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  productThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  itemSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '600',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  scoreVerdictContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  verdictBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  verdictText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
    marginRight: 4,
  },
  chevron: {
    marginLeft: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#14b8a6',
    borderColor: '#14b8a6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#ffffff',
  },
});
