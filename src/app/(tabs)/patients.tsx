import { useTabBarScroll } from '@/src/components/ScrollContext';
import { usePatients } from '@/src/hooks/usePatients';
import {
  borderRadius,
  colors,
  fonts,
  globalStyles,
  spacing,
  typography
} from '@/styles/global';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SEX_FILTER_OPTIONS = [
  { value: 'male', label: 'Male', icon: 'male' as const, color: '#1a57ad' },
  { value: 'female', label: 'Female', icon: 'female' as const, color: '#c62828' },
  { value: 'other', label: 'Other', icon: 'person' as const, color: '#6a1b9a' },
  { value: 'unknown', label: 'Unknown', icon: 'help-circle' as const, color: '#f57c00' },
];

export default function PatientsScreen() {
  const { patients, refresh } = usePatients();
  const { onScroll } = useTabBarScroll();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedSex, setSelectedSex] = useState<Set<string>>(new Set());

  // Refresh patient list when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  function toggleSexFilter(value: string) {
    setSelectedSex((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  const parsedPatients = patients.map((p) => {
    const data = typeof p.data === 'string' ? JSON.parse(p.data) : p.data;
    return {
      id: data.id,
      name: data.name?.[0]
        ? `${data.name[0].given?.[0] ?? ''} ${data.name[0].given?.[1]
            ? `${data.name[0].given[1].charAt(0)}. `
            : ''
          }${data.name[0].family ?? ''}`.trim()
        : 'Unknown',
      gender: data.gender ?? '—',
      birthDate: data.birthDate ?? '—',
      synced: p.synced === 1,
    };
  });

  // Apply search filter
  let filteredPatients = parsedPatients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply sex filter
  if (selectedSex.size > 0) {
    filteredPatients = filteredPatients.filter((p) =>
      selectedSex.has(p.gender.toLowerCase())
    );
  }

  const activeFilterCount = selectedSex.size;

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/register-patient')}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setFilterVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="filter"
            size={16}
            color={activeFilterCount > 0 ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.filterButtonTextActive]}>
            {activeFilterCount > 0 ? `Sex (${activeFilterCount})` : 'Sex'}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={activeFilterCount > 0 ? colors.primary : colors.textTertiary}
          />
        </TouchableOpacity>
        <Text style={styles.totalCount}>
          {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Patient List */}
      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Patients Found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search or filters'
                : 'Tap + to register a new patient'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.patientCard}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/patient/[id]', params: { id: item.id } })}
          >
            <View style={styles.patientAvatar}>
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{item.name}</Text>
              <Text style={styles.patientMeta}>
                {item.gender.charAt(0).toUpperCase() + item.gender.slice(1)} • {item.birthDate}
              </Text>
            </View>
            <View style={styles.syncIndicator}>
              <Ionicons
                name={item.synced ? 'cloud-done' : 'cloud-upload-outline'}
                size={16}
                color={item.synced ? colors.success : colors.warning}
              />
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      />

      {/* Sex Filter Modal */}
      <Modal visible={filterVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Filter by Sex</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={() => setSelectedSex(new Set())}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            {SEX_FILTER_OPTIONS.map((option) => {
              const isSelected = selectedSex.has(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownItem}
                  onPress={() => toggleSexFilter(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dropdownIcon, { backgroundColor: option.color + '14' }]}>
                    <Ionicons name={option.icon} size={16} color={option.color} />
                  </View>
                  <Text style={[styles.dropdownLabel, isSelected && styles.dropdownLabelSelected]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  filterButtonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.primary,
    fontFamily: fonts.medium,
  },
  totalCount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    ...typography.body,
    fontFamily: fonts.semiBold,
    marginBottom: 2,
  },
  patientMeta: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  syncIndicator: {
    marginRight: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },

  // Filter Dropdown Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: 200,
    paddingHorizontal: spacing.xl,
  },
  dropdownContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dropdownTitle: {
    ...typography.h3,
  },
  clearText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontFamily: fonts.medium,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  dropdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownLabel: {
    ...typography.body,
    flex: 1,
    color: colors.textSecondary,
  },
  dropdownLabelSelected: {
    color: colors.text,
    fontFamily: fonts.medium,
  },
});
