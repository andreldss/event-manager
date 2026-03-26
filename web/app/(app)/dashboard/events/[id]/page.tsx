"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

import EventHeader from "@/components/dashboard/events/event-header";
import OverviewTab from "@/components/dashboard/events/overview/overview-tab";
import CollectionsTab from "@/components/dashboard/events/collections/collections-tab";
import Tab from "@/components/dashboard/events/tab";
import FinancialTab from "@/components/dashboard/events/financial/financial-tab";
import AttachmentsTab from "@/components/dashboard/events/storage/attachments-tab";
import { EventGroup } from "@/types/group";

type Event = {
  id: string;
  name: string;
  status: string;
  clientName: string | null;
  date: string | null;
  location: string | null;
  type: "simple" | "collective";
};

type TabKey = "overview" | "finance" | "collections" | "attachments";

export default function EventPage() {
  const params = useParams();
  const id = params.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState<EventGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);


  async function loadGroups() {
    setError('');
    setGroupsLoading(true);

    try {
      const response = await apiFetch(`/events/${id}/group`, 'GET');
      setGroups(Array.isArray(response) ? response : []);
      console.log(groups)
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Falha ao carregar grupos.');
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  }

  async function loadEvent() {
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch(`/events/${id}`, "GET");

      const data: Event = {
        id: response.id,
        name: response.name || "",
        status: response.status || "",
        clientName: response.client?.name ?? null,
        date: response.date || null,
        location: response.location || null,
        type: response.type || "simple",
      };

      setEvent(data);
    } catch {
      setError("Falha ao carregar evento.");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadEvent(); loadGroups();
  }, [id]);

  useEffect(() => {
    setActiveTab("overview");
  }, [id]);

  const isCollective = event?.type === "collective";

  useEffect(() => {
    if (!isCollective && activeTab === "collections") {
      setActiveTab("overview");
    }
  }, [isCollective, activeTab]);

  if (loading) {
    return <p className="text-sm text-gray-600">Carregando evento...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!event) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      <EventHeader event={event} />

      <div className="bg-white rounded-xl flex flex-col flex-1 min-h-0">
        <div className="flex flex-wrap gap-2 p-3">
          <Tab
            label="Visão Geral"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <Tab
            label="Financeiro"
            active={activeTab === "finance"}
            onClick={() => setActiveTab("finance")}
          />
          {isCollective && (
            <Tab
              label="Recolhimentos"
              active={activeTab === "collections"}
              onClick={() => setActiveTab("collections")}
            />
          )}
          <Tab
            label="Anexos"
            active={activeTab === "attachments"}
            onClick={() => setActiveTab("attachments")}
          />
        </div>

        <div className="p-6 flex-1 min-h-0">
          <div className={activeTab === "overview" ? "block h-full" : "hidden"}>
            <OverviewTab
              eventId={Number(event.id)}
              groups={groups}
              onGroupsChanged={loadGroups}
            />
          </div>

          <div className={activeTab === "finance" ? "block h-full" : "hidden"}>
            <FinancialTab
              eventId={Number(event.id)}
            />
          </div>

          {isCollective ? (
            <div
              className={
                activeTab === "collections" ? "block h-full" : "hidden"
              }
            >
              <CollectionsTab
                eventId={Number(event.id)}
                groups={groups}
              />
            </div>
          ) : null}

          <div
            className={activeTab === "attachments" ? "block h-full" : "hidden"}
          >
            <AttachmentsTab
              eventId={Number(event.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
