import { prisma } from '@/lib/prisma';

export class LearningService {
  static async getTopics(userId: string) {
    return prisma.topic.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { modules: true }
    });
  }

  static async createTopic(userId: string, title: string, level: string, goal: string) {
    return prisma.topic.create({
      data: {
        userId,
        title,
        level,
        goal,
        progress: 0
      }
    });
  }

  static async addModuleToTopic(topicId: string, title: string, duration: string, xp: number, order: number) {
    return prisma.module.create({
      data: {
        topicId,
        title,
        duration,
        xp,
        order
      }
    });
  }
}
