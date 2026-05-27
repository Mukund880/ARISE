import { prisma } from '@/lib/prisma';

export class GamificationService {
  static async addXp(userId: string, amount: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const newXp = user.xp + amount;
    const newLevel = Math.floor(newXp / 1000) + 1;
    
    let newRank = "Rookie";
    if (newLevel >= 15) newRank = "Grandmaster";
    else if (newLevel >= 10) newRank = "Master";
    else if (newLevel >= 5) newRank = "Scholar";

    // If user is in a squad, update squad's total XP too
    if (user.squadId) {
      try {
        await prisma.squad.update({
          where: { id: user.squadId },
          data: {
            totalXp: { increment: amount }
          }
        });
      } catch (err) {
        console.error("Failed to update squad total XP:", err);
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXp,
        level: newLevel,
        rank: newRank
      }
    });
  }

  static async getLeaderboard(limit: number = 10) {
    return prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: limit,
      select: {
        id: true,
        displayName: true,
        xp: true,
        level: true,
        rank: true,
        streak: true
      }
    });
  }
}

