import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../control-tower';
import { SearchBar, FilterChips, EmptyState, Card, Badge } from '../../components';
import { Colors, Typography, Spacing } from '../../theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PurchaseOrderRecord } from '../../types';

interface PurchaseOrderListViewProps {
  onSelectPo?: (poId: string) => void;
}

export const PurchaseOrderListView: React.FC<PurchaseOrderListViewProps> = ({
  onSelectPo,
}) => {
  const { purchaseOrders, isRefreshing, refreshData } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'TRANSIT'>('ALL');

  const filterOptions = [
    { id: 'ALL', label: 'All POs', count: purchaseOrders.length },
    {
      id: 'OVERDUE',
      label: 'Overdue / Delayed',
      count: purchaseOrders.filter(p => p.status === 'Overdue' || p.status === 'Delayed').length,
    },
    {
      id: 'TRANSIT',
      label: 'In Transit',
      count: purchaseOrders.filter(p => p.status === 'In Transit').length,
    },
  ];

  const filtered = purchaseOrders.filter(po => {
    const isOverdue = po.status === 'Overdue' || po.status === 'Delayed';
    if (filter === 'OVERDUE' && !isOverdue) return false;
    if (filter === 'TRANSIT' && po.status !== 'In Transit') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        po.id.toLowerCase().includes(q) ||
        po.supplierId.toLowerCase().includes(q) ||
        po.buyer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const renderPoCard = (po: PurchaseOrderRecord) => {
    const isOverdue = po.status === 'Overdue' || po.status === 'Delayed';
    const badgeVariant =
      po.status === 'Overdue'
        ? 'critical'
        : po.status === 'Delayed'
        ? 'warning'
        : 'info';

    return (
      <Card
        key={po.id}
        interactive={!!onSelectPo}
        onPress={() => onSelectPo && onSelectPo(po.id)}
        borderColor={isOverdue ? Colors.status.critical.border : undefined}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.poId}>{po.id}</Text>
            <Text style={styles.supplierText}>Supplier: {po.supplierId}</Text>
          </View>
          <Badge label={po.status.toUpperCase()} variant={badgeVariant} size="small" />
        </View>

        <View style={styles.detailsRow}>
          <View>
            <Text style={styles.detailLabel}>Expected Arrival</Text>
            <Text style={styles.detailValue}>{formatDate(po.expectedDelivery)}</Text>
          </View>
          <View style={styles.detailRight}>
            <Text style={styles.detailLabel}>Commitment</Text>
            <Text style={styles.amountText}>{formatCurrency(po.totalValue)}</Text>
          </View>
        </View>

        <View style={styles.linesRow}>
          <Ionicons name="layers-outline" size={14} color={Colors.cyan[400]} />
          <Text style={styles.linesText}>
            {po.lines.length} Line Item(s): {po.lines.map(l => `${l.productId} (${l.quantity} units)`).join(', ')}
          </Text>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search PO number or supplier..."
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
        renderItem={({ item }) => renderPoCard(item)}
        ListEmptyComponent={
          <EmptyState
            title="No purchase orders found"
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
  card: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  poId: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
  },
  supplierText: {
    ...Typography.caption,
    color: Colors.cyan[400],
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 8,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  detailValue: {
    ...Typography.monoSmall,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    ...Typography.monoSmall,
    color: Colors.cyan[300],
    fontWeight: '700',
    marginTop: 2,
  },
  linesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  linesText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
});
