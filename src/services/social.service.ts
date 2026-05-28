import { prisma } from '@/lib/prisma';

export class SocialService {
  static async getSquads(ownerId?: string) {
    try {
      const count = await prisma.squad.count();
      if (count === 0) {
        // Seed default squads with 0 XP
        await prisma.squad.createMany({
          data: [
            { id: "squad_ai_pioneers", name: "AI Pioneers", desc: "For those pushing the boundaries of machine learning and neural networks.", totalXp: 0 },
            { id: "squad_quantum_scholars", name: "Quantum Scholars", desc: "Exploring the fundamentals of quantum computing and physics-informed AI.", totalXp: 0 },
            { id: "squad_byte_benders", name: "Byte Benders", desc: "Dedicated to solving algorithm puzzles, coding challenges, and system design.", totalXp: 0 },
            { id: "squad_fullstack_wizards", name: "Fullstack Wizards", desc: "Building beautiful, functional web applications from database to UI.", totalXp: 0 },
            { id: "squad_data_alchemists", name: "Data Alchemists", desc: "Unlocking insights from massive datasets and building predictive pipelines.", totalXp: 0 }
          ]
        });
      }
    } catch (err) {
      console.error("Error seeding squads:", err);
    }

    // Fetch squads, and calculate total XP dynamically from the sum of members' XP
    const whereClause = ownerId ? { ownerId } : {};
    
    const squads = await prisma.squad.findMany({
      where: whereClause,
      include: {
        members: {
          select: { xp: true, id: true, displayName: true, level: true, rank: true }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    // Map each squad to calculate total XP based on members' real-time XP
    const mappedSquads = squads.map(s => {
      const realXp = s.members.reduce((acc, m) => acc + m.xp, 0);
      return {
        id: s.id,
        name: s.name,
        desc: s.desc,
        totalXp: realXp,
        _count: s._count,
        members: s.members
      };
    });

    // Sort by real XP desc
    mappedSquads.sort((a, b) => b.totalXp - a.totalXp);
    return mappedSquads;
  }

  static async joinSquad(userId: string, squadId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { squadId }
    });
  }

  static async createSquad(ownerId: string, name: string, desc: string) {
    return prisma.squad.create({
      data: {
        name,
        desc,
        ownerId,
      }
    });
  }

  static async updateSquad(squadId: string, name: string, desc: string) {
    return prisma.squad.update({
      where: { id: squadId },
      data: { name, desc }
    });
  }

  static async deleteSquad(squadId: string) {
    // First remove all members
    await prisma.user.updateMany({
      where: { squadId },
      data: { squadId: null }
    });
    return prisma.squad.delete({
      where: { id: squadId }
    });
  }

  static async removeMember(squadId: string, userId: string) {
    return prisma.user.update({
      where: { id: userId, squadId },
      data: { squadId: null }
    });
  }
}

