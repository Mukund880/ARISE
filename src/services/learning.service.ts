import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, query, where, orderBy } from 'firebase/firestore';

export class LearningService {
  static async getTopics(userId: string) {
    const topicsRef = collection(db, 'topics');
    const q = query(topicsRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    const topics = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    // Sort manually if orderBy createdAt requires a composite index
    topics.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Fetch modules for each topic
    const modulesRef = collection(db, 'modules');
    for (const topic of topics) {
      const mQ = query(modulesRef, where('topicId', '==', topic.id));
      const mSnap = await getDocs(mQ);
      let modules = mSnap.docs.map(md => ({ id: md.id, ...md.data() })) as any[];
      modules.sort((a, b) => a.order - b.order);
      topic.modules = modules;
    }

    return topics;
  }

  static async createTopic(userId: string, title: string, level: string, goal: string) {
    const newTopicRef = doc(collection(db, 'topics'));
    const topicData = {
      userId,
      title,
      level,
      goal,
      progress: 0,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(newTopicRef, topicData);
    return { id: newTopicRef.id, ...topicData };
  }

  static async addModuleToTopic(topicId: string, title: string, duration: string, xp: number, order: number) {
    const newModuleRef = doc(collection(db, 'modules'));
    const moduleData = {
      topicId,
      title,
      duration,
      xp,
      order,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(newModuleRef, moduleData);
    return { id: newModuleRef.id, ...moduleData };
  }
}
