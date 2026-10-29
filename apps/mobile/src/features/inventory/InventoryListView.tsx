import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useData, InventoryRiskCard } from '../control-tower';
import { SearchBar, FilterChips, EmptyState } from '../../components';
import { Colors, Spacing } from '../../theme';

interface InventoryListViewProps {
  onSelectSku?: (sku: string) => void;
  onRebalance?: (sku: string) => void;
}

export const InventoryListView: React.FC<InventoryListViewProps> = ({
  onSelectSku,
  onRebalance,
}) => {
  const { inventory, isRefreshing, refreshData } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'AT_RISK' | 'HEALTHY'>('ALL');

  const filterOptions = [
    { id: 'ALL', label: 'All SKUs', count: inventory.length },
    {
      id: 'AT_RISK',
      label: 'At Risk (< Safety)',
      count: inventory.filter(i => (i.onHand - i.reserved) < i.safetyStock).length,
    },
    {
      id: 'HEALTHY',
      label: 'Buffer Healthy',
      count: inventory.filter(i => (i.onHand - i.reserved) >= i.safetyStock).length,
    },
  ];

  const filtered = inventory.filter(item => {
    const available = item.onHand - item.reserved;
    const isAtRisk = available < item.safetyStock;

    if (filter === 'AT_RISK' && !isAtRisk) return false;
    if (filter === 'HEALTHY' && isAtRisk) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.productId.toLowerCase().includes(q) ||
        item.warehouseId.toLowerCase().includes(q)
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
          placeholder="Filter SKU or warehouse..."
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
          <InventoryRiskCard
            inventory={item}
            onPress={() => onSelectSku && onSelectSku(item.productId)}
            onRebalancePress={onRebalance}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No inventory records found"
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
