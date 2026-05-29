import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

export interface Notification {
  id: string;
  title: string;
  desc: string;
  createdAt: string;
  read: boolean;
}

export class NotificationService {
  /**
   * Send a notification to a specific user
   */
  static async sendNotification(userId: string, title: string, desc: string) {
    try {
      const notifRef = collection(db, 'users', userId, 'notifications');
      await addDoc(notifRef, {
        title,
        desc,
        createdAt: new Date().toISOString(),
        read: false
      });
    } catch (err) {
      console.error(`Error sending notification to user ${userId}:`, err);
    }
  }

  /**
   * Send notification to all members of a squad
   */
  static async notifySquadMembers(squadId: string, title: string, desc: string) {
    try {
      // Find all users who are members of this squad
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      const members = snap.docs.filter(doc => {
        const data = doc.data();
        return data.squadId === squadId || (data.squadIds && data.squadIds.includes(squadId));
      });

      const promises = members.map(memberDoc => 
        this.sendNotification(memberDoc.id, title, desc)
      );
      await Promise.all(promises);
    } catch (err) {
      console.error(`Error notifying squad members of squad ${squadId}:`, err);
    }
  }

  /**
   * Listen to real-time notifications of a user
   */
  static listenToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const notifRef = collection(db, 'users', userId, 'notifications');
    const q = query(notifRef, orderBy('createdAt', 'desc'), limit(15));
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      callback(notifications);
    }, (error) => {
      console.error("Error listening to notifications:", error);
    });
  }

  /**
   * Mark all notifications of a user as read
   */
  static async markAllAsRead(userId: string, notifications: Notification[]) {
    try {
      const promises = notifications
        .filter(n => !n.read)
        .map(async (n) => {
          const docRef = doc(db, 'users', userId, 'notifications', n.id);
          await updateDoc(docRef, { read: true });
        });
      await Promise.all(promises);
    } catch (err) {
      console.error(`Error marking notifications as read for user ${userId}:`, err);
    }
  }
}
