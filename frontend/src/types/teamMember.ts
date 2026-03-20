export type TeamMemberRole = 'MANAGER' | 'LEAD' | 'OPERATOR';

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: TeamMemberRole;
  active: boolean;
  invitedAt: string;
  joinedAt: string | null;
}

export interface CreateTeamMemberRequest {
  name: string;
  email: string;
  phone?: string;
  role: TeamMemberRole;
}

export interface UpdateTeamMemberRequest {
  name: string;
  phone?: string;
  role?: TeamMemberRole;
}
