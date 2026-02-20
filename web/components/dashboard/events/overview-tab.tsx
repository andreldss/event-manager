import { EventChart } from "./charts/event-charts";
import { useParams } from "next/navigation";
import OverviewChecklist from "./overview/checklist";
import OverviewGroups from "./overview/groups";

export default function OverviewTab() {

    const params = useParams();
    const eventId = Number(params.id);

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
