export type Event = {
  id: string;
  name: string;
  status: string;
  clientName: string | null;
  date: string | null;
  location: string | null;
  type: "simple" | "collective";
};
