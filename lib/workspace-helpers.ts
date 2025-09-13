import { prisma } from "@/lib/db";

export async function getUserWorkspaceStatus(userId: string, workspaceId: string) {
  const userWorkspace = await prisma.userWorkspace.findFirst({
    where: {
      userId,
      workspaceId
    }
  });
  
  if (!userWorkspace) {
    return { isActive: false, isRemoved: false, exists: false };
  }
  
  return {
    isActive: !userWorkspace.removedAt,
    isRemoved: !!userWorkspace.removedAt,
    exists: true,
    removedAt: userWorkspace.removedAt
  };
}

export async function enrichUsersWithWorkspaceStatus(users: { id: string; [key: string]: unknown }[], workspaceId: string) {
  // Get all user IDs
  const userIds = users.map(u => u.id).filter(Boolean);
  
  if (userIds.length === 0) return users;
  
  // Fetch workspace membership status for all users
  const userWorkspaces = await prisma.userWorkspace.findMany({
    where: {
      userId: { in: userIds },
      workspaceId
    }
  });
  
  // Create a map for quick lookup
  const statusMap = new Map(
    userWorkspaces.map(uw => [
      uw.userId,
      { isRemoved: !!uw.removedAt, removedAt: uw.removedAt }
    ])
  );
  
  // Enrich users with their workspace status
  return users.map(user => ({
    ...user,
    isRemovedFromWorkspace: statusMap.get(user.id)?.isRemoved || false,
    removedAt: statusMap.get(user.id)?.removedAt
  }));
}