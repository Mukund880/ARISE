import { prisma } from '@/lib/prisma';

export class UserService {
  static async getUserProfile(uid: string, email: string, displayName?: string) {
    let user = await prisma.user.findUnique({ where: { id: uid } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uid,
          email,
          displayName,
          xp: 0,
          level: 1,
          rank: 'Rookie',
          streak: 1
        }
      });
    }
    
    return user;
  }

  static async updateStreak(uid: string) {
    // Basic streak logic placeholder
    return prisma.user.update({
      where: { id: uid },
      data: {
        streak: { increment: 1 }
      }
    });
  }
}
