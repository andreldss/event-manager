import { EventGroup } from "@/types/group";
import { EventChart } from "../charts/event-charts";
import OverviewChecklist from "./checklist";
import OverviewGroups from "./groups";

type Props = {
  eventId: number;
  groups: EventGroup[];
  onGroupsChanged: () => Promise<void>;
};

export default function OverviewTab({ eventId, groups, onGroupsChanged }: Props) {
  return (
    <div className="h-full min-h-0 grid grid-cols-4 gap-6">
      <div className="col-span-4 lg:col-span-1 flex flex-col min-h-0 gap-6">
        <OverviewChecklist eventId={eventId} />
        <OverviewGroups eventId={eventId} groups={groups} onGroupsChanged={onGroupsChanged} />
      </div>

      <div className="hidden lg:block lg:col-span-3 min-h-0">
        <EventChart eventId={eventId} />
      </div>
    </div>
  );
}
