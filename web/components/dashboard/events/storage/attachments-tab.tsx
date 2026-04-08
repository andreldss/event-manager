"use client";

import StorageManager from "../../storage/storage-manager";

type Props = {
  eventId: number;
};

export default function AttachmentsTab({ eventId }: Props) {
  return (
    <StorageManager eventId={eventId} rootLabel="Anexos" queryTab="storage" />
  );
}
