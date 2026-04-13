export type Event = {
  id: string;
  name: string;
  status: string;
  clientId?: number | null;
  clientName: string | null;
  date: string | null;
  location: string | null;
  notes?: string | null;
  type: "simple" | "collective";
};
