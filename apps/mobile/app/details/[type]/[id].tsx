import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../../src/features/control-tower';
import { Header, Card, Badge, Button, ConfirmationModal, EmptyState } from '../../../src/components';
import { Colors, Typography, Spacing, Radius } from '../../../src/theme';
import { formatCurrency, formatDate, formatNumber, formatPercentage } from '../../../src/utils/formatters';

export default function RecordDetailScreen() {
  const router = useRouter();
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const { exceptions, shipments, inventory, suppliers, purchaseOrders, executeAction, refreshData } = useData();

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    description: string;
    actionType: string;
    entityId: string;
    payload?: Record<string, any>;
  }>({
    visible: false,
    title: '',
    description: '',
    actionType: '',
    entityId: '',
  });

  const [isExecuting, setIsExecuting] = useState(false);

  // Resolve record
  const exception = type === 'exception' ? exceptions.find(e => e.id === id) : null;
  const shipment = type === 'shipment' ? shipments.find(s => s.id === id) : null;
  const inv = type === 'inventory' ? inventory.find(i => i.productId === id) : null;
  const supplier = type === 'supplier' ? suppliers.find(s => s.id === id) : null;
  const po = type === 'po' ? purchaseOrders.find(p => p.id === id) : null;

  const notFound = !exception && !shipment && !inv && !supplier && !po;

  const handleTriggerAction = (
    title: string,
    description: string,
    actionType: string,
    entityId: string,
    payload?: Record<string, any>
  ) => {
    setConfirmModal({
      visible: true,
      title,
      description,
      actionType,
      entityId,
      payload,
    });
  };

  const handleConfirmAction = async () => {
    setIsExecuting(true);
    try {
      const res = await executeAction(
        confirmModal.actionType,
        confirmModal.entityId,
        confirmModal.payload
      );
      setConfirmModal(prev => ({ ...prev, visible: false }));
      Alert.alert('Action Committed', res.message);
      await refreshData();
    } catch (err: any) {
      Alert.alert('Authorization Failure', err.message || 'Action could not be executed.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (notFound) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header
          title="RECORD NOT FOUND"
          showBack
          onBack={() => router.back()}
        />
        <EmptyState
          title={`No record found for ID: ${id}`}
          description="The operational record may have been archived or resolved."
          actionLabel="Return to Control Tower"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title={id?.toUpperCase() || 'RECORD'}
        subtitle={`Domain Entity: ${type?.toUpperCase()}`}
        showBack
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* EXCEPTION DETAIL */}
        {exception && (
          <View>
            <Card borderColor={Colors.status.critical.border} style={styles.mainCard}>
              <View style={styles.headerRow}>
                <View style={styles.titleCol}>
                  <Text style={styles.recordTitle}>{exception.type}</Text>
                  <Text style={styles.recordSubtitle}>Assigned: {exception.owner}</Text>
                </View>
                <Badge label={exception.severity.toUpperCase()} variant="critical" />
              </View>

              <Text style={styles.descriptionText}>{exception.description}</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Target Entity</Text>
                  <Text style={styles.statValue}>{exception.entityId}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Status</Text>
                  <Text style={styles.statValue}>{exception.status}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Impact at Risk</Text>
                  <Text style={[styles.statValue, { color: Colors.status.critical.text }]}>
                    {formatCurrency(exception.estimatedImpact)}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRecommendationBox}>
                <Text style={styles.recommendationHeader}>AI MITIGATION RECOMMENDATION</Text>
                <Text style={styles.recommendationText}>{exception.recommendedAction}</Text>
              </View>

              <Button
                title="Execute Recommended Mitigation"
                onPress={() =>
                  handleTriggerAction(
                    `Resolve Exception ${exception.id}`,
                    exception.recommendedAction,
                    'RESOLVE_EXCEPTION',
                    exception.id,
                    { action: exception.recommendedAction }
                  )
                }
                style={styles.actionButton}
              />
            </Card>
          </View>
        )}

        {/* SHIPMENT DETAIL */}
        {shipment && (
          <View>
            <Card
              borderColor={shipment.delayDays > 0 ? Colors.status.critical.border : undefined}
              style={styles.mainCard}
            >
              <View style={styles.headerRow}>
                <View style={styles.titleCol}>
                  <Text style={styles.recordTitle}>{shipment.carrier}</Text>
                  <Text style={styles.recordSubtitle}>Tracking: {shipment.trackingNumber}</Text>
                </View>
                <Badge
                  label={shipment.delayDays > 0 ? `DELAYED +${shipment.delayDays}D` : shipment.status.toUpperCase()}
                  variant={shipment.delayDays > 0 ? 'critical' : 'success'}
                />
              </View>

              <View style={styles.routeBox}>
                <View style={styles.routeRow}>
                  <Ionicons name="radio-button-on" size={16} color={Colors.cyan[400]} />
                  <Text style={styles.routeText}>Origin: {shipment.origin}</Text>
                </View>
                <View style={styles.routeConnector} />
                <View style={styles.routeRow}>
                  <Ionicons name="location" size={16} color={shipment.delayDays > 0 ? Colors.status.critical.text : Colors.textPrimary} />
                  <Text style={styles.routeText}>Destination: {shipment.destination}</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>PO Reference</Text>
                  <Text style={styles.statValue}>{shipment.poId}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Expected ETA</Text>
                  <Text style={styles.statValue}>{formatDate(shipment.expectedArrival)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Freight Value</Text>
                  <Text style={styles.statValue}>{formatCurrency(shipment.freightCost)}</Text>
                </View>
              </View>

              {shipment.delayDays > 0 && (
                <Button
                  title="Authorize Priority Intermodal Reroute"
                  onPress={() =>
                    handleTriggerAction(
                      `Reroute ${shipment.id}`,
                      `Reroute consignment ${shipment.id} via rail corridor PAC-04 to avoid Long Beach port congestion.`,
                      'REROUTE_SHIPMENT',
                      shipment.id,
                      { corridor: 'PAC-04' }
                    )
                  }
                  style={styles.actionButton}
                />
              )}
            </Card>
          </View>
        )}

        {/* INVENTORY DETAIL */}
        {inv && (
          <View>
            <Card style={styles.mainCard}>
              <View style={styles.headerRow}>
                <View style={styles.titleCol}>
                  <Text style={styles.recordTitle}>{inv.productId}</Text>
                  <Text style={styles.recordSubtitle}>Distribution Center: {inv.warehouseId}</Text>
                </View>
                <Badge
                  label={inv.onHand - inv.reserved < inv.safetyStock ? 'STOCKOUT RISK' : 'NOMINAL'}
                  variant={inv.onHand - inv.reserved < inv.safetyStock ? 'critical' : 'success'}
                />
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>On Hand</Text>
                  <Text style={styles.statValue}>{formatNumber(inv.onHand)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Reserved</Text>
                  <Text style={styles.statValue}>{formatNumber(inv.reserved)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Net Available</Text>
                  <Text style={[styles.statValue, { color: Colors.cyan[300] }]}>
                    {formatNumber(inv.onHand - inv.reserved)}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Safety Stock</Text>
                  <Text style={styles.statValue}>{formatNumber(inv.safetyStock)}</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>In Transit</Text>
                  <Text style={styles.statValue}>{formatNumber(inv.inTransit)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Lead Time</Text>
                  <Text style={styles.statValue}>{inv.leadTime} days</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Unit Cost</Text>
                  <Text style={styles.statValue}>{formatCurrency(inv.unitCost)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Daily Run Rate</Text>
                  <Text style={styles.statValue}>{inv.dailyDemand} / day</Text>
                </View>
              </View>

              <Button
                title="Trigger Autonomous Emergency Rebalance"
                onPress={() =>
                  handleTriggerAction(
                    `Rebalance ${inv.productId}`,
                    `Calibrate safety buffer and transfer 45 units from Dallas DC-02 to ${inv.warehouseId}.`,
                    'CALIBRATE_BUFFER',
                    inv.productId,
                    { targetDc: inv.warehouseId, quantity: 45 }
                  )
                }
                style={styles.actionButton}
              />
            </Card>
          </View>
        )}

        {/* SUPPLIER DETAIL */}
        {supplier && (
          <View>
            <Card style={styles.mainCard}>
              <View style={styles.headerRow}>
                <View style={styles.titleCol}>
                  <Text style={styles.recordTitle}>{supplier.name}</Text>
                  <Text style={styles.recordSubtitle}>{supplier.category} • {supplier.country}</Text>
                </View>
                <Badge
                  label={`${(supplier.riskLevel || 'Medium').toUpperCase()} RISK`}
                  variant={supplier.riskLevel === 'High' ? 'critical' : 'success'}
                />
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>OTIF Fulfillment</Text>
                  <Text style={styles.statValue}>{formatPercentage(supplier.otif)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Quality Acceptance</Text>
                  <Text style={styles.statValue}>{formatPercentage(supplier.qualityRate)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Defect Rate</Text>
                  <Text style={styles.statValue}>{formatPercentage(supplier.defectRate)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Avg Lead Time</Text>
                  <Text style={styles.statValue}>{supplier.leadTime} days</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Annual Spend</Text>
                  <Text style={[styles.statValue, { color: Colors.cyan[300] }]}>
                    {formatCurrency(supplier.spend)}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Open PO Commitment</Text>
                  <Text style={styles.statValue}>{formatCurrency(supplier.openPoValue || 0)}</Text>
                </View>
              </View>

              {supplier.riskLevel === 'High' && (
                <Button
                  title="Issue Formal SLA Non-Compliance Warning"
                  onPress={() =>
                    handleTriggerAction(
                      `Issue SLA Warning to ${supplier.name}`,
                      `Formally notify ${supplier.contact} of contract breach due to OTIF falling below threshold.`,
                      'SUPPLIER_SLA_WARNING',
                      supplier.id,
                      { supplierId: supplier.id }
                    )
                  }
                  variant="danger"
                  style={styles.actionButton}
                />
              )}
            </Card>
          </View>
        )}

        {/* PURCHASE ORDER DETAIL */}
        {po && (
          <View>
            <Card style={styles.mainCard}>
              <View style={styles.headerRow}>
                <View style={styles.titleCol}>
                  <Text style={styles.recordTitle}>{po.id}</Text>
                  <Text style={styles.recordSubtitle}>Supplier: {po.supplierId} • Buyer: {po.buyer}</Text>
                </View>
                <Badge
                  label={po.status.toUpperCase()}
                  variant={po.status === 'Overdue' ? 'critical' : 'info'}
                />
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Commitment</Text>
                  <Text style={[styles.statValue, { color: Colors.cyan[300] }]}>
                    {formatCurrency(po.totalValue)}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Expected Delivery</Text>
                  <Text style={styles.statValue}>{formatDate(po.expectedDelivery)}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>LINE ITEMS</Text>
              {po.lines.map((line, idx) => (
                <View key={idx} style={styles.lineItem}>
                  <View>
                    <Text style={styles.lineProduct}>{line.productId}</Text>
                    <Text style={styles.lineQty}>Ordered: {line.quantity} units</Text>
                  </View>
                  <Text style={styles.linePrice}>{formatCurrency(line.unitPrice * line.quantity)}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel="Authorize Action"
        cancelLabel="Dismiss"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
        isConsequential
        isLoading={isExecuting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  mainCard: {
    padding: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  titleCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  recordTitle: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
  },
  recordSubtitle: {
    ...Typography.caption,
    color: Colors.cyan[400],
    marginTop: 2,
  },
  descriptionText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  statValue: {
    ...Typography.monoSmall,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  actionRecommendationBox: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  recommendationHeader: {
    ...Typography.caption,
    color: Colors.cyan[400],
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  recommendationText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  actionButton: {
    marginTop: Spacing.sm,
  },
  routeBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  routeConnector: {
    width: 2,
    height: 16,
    backgroundColor: Colors.borderSubtle,
    marginLeft: 7,
    marginVertical: 4,
  },
  routeText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  lineProduct: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  lineQty: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  linePrice: {
    ...Typography.monoSmall,
    color: Colors.cyan[300],
    fontWeight: '600',
  },
});
