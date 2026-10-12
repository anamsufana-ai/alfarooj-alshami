export function canRecordDriverLocation(input: {
  consent: boolean;
  role: string;
  assignmentActive: boolean;
  fulfillmentStatus: string;
  shiftOpen: boolean;
}): boolean {
  return (
    input.consent &&
    input.role === "driver" &&
    input.assignmentActive &&
    input.fulfillmentStatus === "out_for_delivery" &&
    input.shiftOpen
  );
}

export function roundCoordinate(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function locationExpiresAt(recordedAt: Date, retentionDays: number): Date {
  return new Date(recordedAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);
}
