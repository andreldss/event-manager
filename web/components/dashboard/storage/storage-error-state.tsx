"use client";

export default function StorageErrorState({ error }: { error: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="text-sm text-red-500">{error}</span>
    </div>
  );
}
