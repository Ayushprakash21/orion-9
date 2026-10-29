import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useData, SupplierCard } from '../control-tower';
import { SearchBar, FilterChips, EmptyState } from '../../components';
import { Colors, Spacing } from '../../theme';

interface SupplierListViewProps {
  onSelectSupplier?: (supplierId: string) => void;
  onContactSupplier?: (contact: string) => void;
}

export const SupplierListView: React.FC<SupplierListViewProps> = ({
  onSelectSupplier,
  onContactSupplier,
}) => {
  const { suppliers, isRefreshing, refreshData } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'HIGH_RISK' | 'PREFERRED'>('ALL');

  const filterOptions = [
    { id: 'ALL', label: 'All Partners', count: suppliers.length },
    {
      id: 'HIGH_RISK',
      label: 'High Risk (OTIF < 85%)',
      count: suppliers.filter(s => s.riskLevel === 'High').length,
    },
    {
      id: 'PREFERRED',
      label: 'Preferred',
      count: suppliers.filter(s => s.status === 'Preferred').length,
    },
  ];

  const filtered = suppliers.filter(supplier => {
    if (filter === 'HIGH_RISK' && supplier.riskLevel !== 'High') return false;
    if (filter === 'PREFERRED' && supplier.status !== 'Preferred') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const countryMatch = (supplier.country || '').toLowerCase().includes(q);
      return (
        supplier.name.toLowerCase().includes(q) ||
        supplier.category.toLowerCase().includes(q) ||
        countryMatch
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search partner, category, country..."
        />
      </View>

      <FilterChips
        options={filterOptions}
        selectedId={filter}
        onSelect={id => setFilter(id as any)}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            tintColor={Colors.cyan[500]}
          />
        }
        renderItem={({ item }) => (
          <SupplierCard
            supplier={item}
            onPress={() => onSelectSupplier && onSelectSupplier(item.id)}
            onContactPress={onContactSupplier}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No suppliers found"
            description="Adjust your search or active filter."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
  },
});
