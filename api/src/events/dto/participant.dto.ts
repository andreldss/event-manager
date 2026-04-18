export class CreateParticipantDto {
  eventId: number;
  name: string;
  groupId?: number;
}

export class UpdateParticipantDto {
  expectedAmount: number | null;
}
