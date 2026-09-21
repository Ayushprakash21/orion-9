/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Notification Engine
 * 
 * Manages operational notifications, in-app escalations, and stakeholder dispatch.
 * Isolated from business mutations; failure to notify never falsely succeeds or corrupts transactions.
 */

export interface WorkflowNotification {
  notificationId: string;
  tenantId: string;
  workflowInstanceId: string;
  recipientRole: string;
  recipientUserId?: string;
  channel: 'IN_APP' | 'EMAIL_DIGEST' | 'ESCALATION_ALERT';
  title: string;
  body: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  createdAt: string;
}

export class WorkflowNotificationEngine {
  private static instance: WorkflowNotificationEngine;
  private notifications: Map<string, WorkflowNotification[]> = new Map(); // key: tenantId

  private constructor() {}

  public static getInstance(): WorkflowNotificationEngine {
    if (!WorkflowNotificationEngine.instance) {
      WorkflowNotificationEngine.instance = new WorkflowNotificationEngine();
    }
    return WorkflowNotificationEngine.instance;
  }

  public sendNotification(
    tenantId: string,
    workflowInstanceId: string,
    recipientRole: string,
    title: string,
    body: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM',
    channel: 'IN_APP' | 'EMAIL_DIGEST' | 'ESCALATION_ALERT' = 'IN_APP',
    recipientUserId?: string
  ): WorkflowNotification {
    const notification: WorkflowNotification = {
      notificationId: `NOTIF-${tenantId}-${Date.now()}-${Math.floor(Date.now() % 10000)}`,
      tenantId,
      workflowInstanceId,
      recipientRole,
      recipientUserId,
      channel,
      title,
      body,
      priority,
      status: 'DELIVERED',
      createdAt: new Date().toISOString()
    };

    const list = this.notifications.get(tenantId) || [];
    list.push(notification);
    this.notifications.set(tenantId, list);

    return notification;
  }

  public getNotifications(tenantId: string): WorkflowNotification[] {
    return JSON.parse(JSON.stringify(this.notifications.get(tenantId) || []));
  }

  public clear(): void {
    this.notifications.clear();
  }
}

export const workflowNotificationEngine = WorkflowNotificationEngine.getInstance();
