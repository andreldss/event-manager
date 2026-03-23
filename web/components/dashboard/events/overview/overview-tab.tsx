import { EventChart } from "../charts/event-charts";
import OverviewChecklist from "./checklist";
import OverviewGroups from "./groups";

type Props = {
  eventId: number;
  refreshKey: number;
};

export default function OverviewTab({ eventId, refreshKey }: Props) {
  return (
    <div className="h-full min-h-0 grid grid-cols-4 gap-6">
      <div className="col-span-4 lg:col-span-1 flex flex-col min-h-0 gap-6">
        <OverviewChecklist eventId={eventId} />
        <OverviewGroups eventId={eventId} />
      </div>

      <div className="hidden lg:block lg:col-span-3 min-h-0">
        <EventChart eventId={eventId} />
      </div>
    </div>
  );
}
