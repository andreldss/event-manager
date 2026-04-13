import { EventGroup } from "@/types/group";
import { EventChart } from "../charts/event-charts";
import OverviewChecklist from "./checklist";
import OverviewGroups from "./groups";
import { Event } from "@/types/event";
import EventHeader from "../event-header";

type Props = {
  eventId: number;
  groups: EventGroup[];
  onGroupsChanged: () => Promise<void>;
  financialRefreshTrigger: number;
  event: Event;
  canManageEvent?: boolean;
  onEditEvent?: () => void;
  onDeleteEvent?: () => void;
};

export default function OverviewTab({
  eventId,
  groups,
  onGroupsChanged,
  financialRefreshTrigger,
  event,
  canManageEvent = false,
  onEditEvent,
  onDeleteEvent,
}: Props) {
  return (
    <div className="grid grid-cols-4 gap-5 min-h-0 h-full">
      <div className="col-span-4 lg:col-span-1 flex flex-col gap-4 min-h-0">
        <OverviewChecklist eventId={eventId} />
        <OverviewGroups
          eventId={eventId}
          groups={groups}
          onGroupsChanged={onGroupsChanged}
        />
      </div>

      <div className="hidden lg:col-span-3 lg:flex lg:flex-col lg:gap-5 min-h-0 min-w-0">
        <EventHeader
          event={event}
          canManage={canManageEvent}
          onEdit={onEditEvent}
          onDelete={onDeleteEvent}
        />
        <div className="min-h-[320px] w-full min-w-0 flex-1">
          <EventChart
            eventId={eventId}
            financialRefreshTrigger={financialRefreshTrigger}
          />
        </div>
      </div>
    </div>
  );
}
