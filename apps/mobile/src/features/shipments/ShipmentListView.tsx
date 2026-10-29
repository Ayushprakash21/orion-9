import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useData, ShipmentCard } from '../control-tower';
import { SearchBar, FilterChips, EmptyState } from '../../components';
import { Colors, Spacing } from '../../theme';

interface ShipmentListViewProps {
  onSelectShipment?: (shipmentId: string) => void;
  onActionPress?: (action: string, shipmentId: string) => void;
}

export const ShipmentListView: React.FC<ShipmentListViewProps> = ({
  onSelectShipment,
  onActionPress,
}) => {
  const { shipments, isRefreshing, refreshData } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'DELAYED' | 'IN_TRANSIT' | 'DELIVERED'>('ALL');

  const filterOptions = [
    { id: 'ALL', label: 'All Convoys', count: shipments.length },
    {
      id: 'DELAYED',
      label: 'Delayed',
      count: shipments.filter(s => s.delayDays > 0).length,
    },
    {
      id: 'IN_TRANSIT',
      label: 'In Transit',
      count: shipments.filter(s => s.status === 'In Transit').length,
    },
    {
      id: 'DELIVERED',
      label: 'Delivered',
      count: shipments.filter(s => s.status === 'Delivered').length,
    },
  ];

  const filtered = shipments.filter(shipment => {
    if (filter === 'DELAYED' && shipment.delayDays <= 0) return false;
    if (filter === 'IN_TRANSIT' && shipment.status !== 'In Transit') return false;
    if (filter === 'DELIVERED' && shipment.status !== 'Delivered') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        shipment.id.toLowerCase().includes(q) ||
        shipment.carrier.toLowerCase().includes(q) ||
        shipment.destination.toLowerCase().includes(q) ||
        shipment.origin.toLowerCase().includes(q) ||
        shipment.poId.toLowerCase().includes(q)
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
          placeholder="Search carrier, consignment, route..."
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
          <ShipmentCard
            shipment={item}
            onPress={() => onSelectShipment && onSelectShipment(item.id)}
            onActionPress={action => onActionPress && onActionPress(action, item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No shipments found"
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
