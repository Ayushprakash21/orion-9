import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { UserProfile, Organization, AuditEvent } from '../types/auth';

class FirebaseDbService {
  private get db(): Firestore | null {
    try {
      return getFirebaseFirestore();
    } catch {
      return null;
    }
  }

  async getCollection<T>(collectionName: string): Promise<T[]> {
    const firestore = this.db;
    if (!firestore) return [];
    try {
      const snap = await getDocs(collection(firestore, collectionName));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T));
    } catch (err) {
      console.warn(`[FirebaseDb] getCollection(${collectionName}) fallback:`, err);
      return [];
    }
  }

  async getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    const firestore = this.db;
    if (!firestore) return null;
    try {
      const snap = await getDoc(doc(firestore, collectionName, id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as unknown as T;
    } catch (err) {
      console.warn(`[FirebaseDb] getDocument(${collectionName}, ${id}) fallback:`, err);
      return null;
    }
  }

  async setDocument<T extends Record<string, any>>(collectionName: string, id: string, data: T): Promise<void> {
    const firestore = this.db;
    if (!firestore) throw new Error(`[FirebaseDb] Firestore instance unavailable for setDocument(${collectionName}, ${id})`);
    try {
      await setDoc(doc(firestore, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      console.error(`[FirebaseDb] Authoritative write failed for ${collectionName}/${id}:`, err);
      throw err;
    }
  }

  async deleteDocument(collectionName: string, id: string): Promise<void> {
    const firestore = this.db;
    if (!firestore) throw new Error(`[FirebaseDb] Firestore instance unavailable for deleteDocument(${collectionName}, ${id})`);
    try {
      await deleteDoc(doc(firestore, collectionName, id));
    } catch (err: any) {
      console.error(`[FirebaseDb] Authoritative delete failed for ${collectionName}/${id}:`, err);
      throw err;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    await this.setDocument('users', profile.id, profile);
  }

  async getUserProfile(id: string): Promise<UserProfile | null> {
    return this.getDocument<UserProfile>('users', id);
  }

  async saveOrganization(org: Organization): Promise<void> {
    await this.setDocument('organizations', org.id, org);
  }

  async getOrganization(id: string): Promise<Organization | null> {
    return this.getDocument<Organization>('organizations', id);
  }

  async recordAuditEvent(event: Partial<AuditEvent>): Promise<void> {
    const id = event.id || `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.setDocument('audit_logs', id, {
      ...event,
      timestamp: new Date().toISOString()
    });
  }
}

export const firebaseDbService = new FirebaseDbService();
