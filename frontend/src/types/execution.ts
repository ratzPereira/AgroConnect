export interface ServiceExecution {
  id: number;
  proposalId: number;
  requestId: number;
  scheduledDate: string | null;
  scheduledEndDate: string | null;
  checkinLatitude: number | null;
  checkinLongitude: number | null;
  checkinTime: string | null;
  checkoutTime: string | null;
  notes: string | null;
  materialsUsed: string | null;
  completedAt: string | null;
  createdAt: string;
  assignments: ExecutionAssignment[];
  photos: ExecutionPhoto[];
}

export interface ExecutionAssignment {
  id: number;
  teamMemberId: number;
  teamMemberName: string;
  teamMemberRole: string;
  machineId: number | null;
  machineName: string | null;
  assignedAt: string;
}

export interface ExecutionPhoto {
  id: number;
  photoUrl: string;
  latitude: number | null;
  longitude: number | null;
  takenAt: string | null;
  uploadedAt: string;
}
