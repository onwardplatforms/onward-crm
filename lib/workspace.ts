import { prisma } from "@/lib/db";

export async function getCurrentWorkspace(userId: string, sessionId?: string) {
  // First check if session has a current workspace
  if (sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { currentWorkspaceId: true }
    });
    
    if (session?.currentWorkspaceId) {
      // Verify user has access to this workspace
      const userWorkspace = await prisma.userWorkspace.findFirst({
        where: {
          userId,
          workspaceId: session.currentWorkspaceId
        },
        include: {
          workspace: true
        }
      });
      
      if (userWorkspace) {
        return userWorkspace.workspace;
      }
    }
  }
  
  // Fall back to user's first workspace
  const userWorkspace = await prisma.userWorkspace.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { joinedAt: 'asc' }
  });
  
  if (!userWorkspace) {
    throw new Error("User has no workspace");
  }
  
  // Update session with this workspace if we have a sessionId
  if (sessionId) {
    await prisma.session.update({
      where: { id: sessionId },
      data: { currentWorkspaceId: userWorkspace.workspaceId }
    });
  }
  
  return userWorkspace.workspace;
}

export async function createWorkspaceForUser(userId: string, workspaceName?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true }
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Use first name for workspace name if not provided
  const firstName = user.name?.split(' ')[0] || user.email.split('@')[0];
  const finalWorkspaceName = workspaceName || `${firstName}'s Workspace`;
  
  // Generate a unique slug from the workspace name
  const baseSlug = finalWorkspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Find a unique slug (but keep the workspace name the same)
  let slug = baseSlug;
  let counter = 1;
  
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  // Create the workspace and add the user as owner
  const workspace = await prisma.workspace.create({
    data: {
      name: finalWorkspaceName,
      slug,
      users: {
        create: {
          userId,
          role: 'owner'
        }
      }
    }
  });
  
  return workspace;
}

export async function getUserWorkspaces(userId: string) {
  const userWorkspaces = await prisma.userWorkspace.findMany({
    where: { userId },
    include: { workspace: true },
    orderBy: { joinedAt: 'asc' }
  });
  
  return userWorkspaces.map(uw => ({
    ...uw.workspace,
    role: uw.role,
    joinedAt: uw.joinedAt
  }));
}