"use client";

import { useState, useEffect } from "react";

interface EventItem {
  id: string;
  headline: string;
  description: string;
  image_url: string;
  event_date: string;
  associations?: {
    code: string;
    name: string;
  };
}

type ViewType = "month" | "week" | "year";
type SortBy = "date" | "country" | "association";

export default function PublicEventsPage() {
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [sortedEvents, setSortedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>("month");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const sorted = [...eventsList];
    if (sortBy === "date") {
      sorted.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    } else if (sortBy === "country") {
      sorted.sort((a, b) => (a.associations?.code || "").localeCompare(b.associations?.code || ""));
    } else if (sortBy === "association") {
      sorted.sort((a, b) => (a.associations?.name || "").localeCompare(b.associations?.name || ""));
    }
    setSortedEvents(sorted);
  }, [eventsList, sortBy]);

  async function fetchEvents() {
    try {
      const response = await fetch("/api/association/events");
      const data = await response.json();
      setEventsList(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function hasEvent(dateStr: string): boolean {
    return eventsList.some((e) => e.event_date === dateStr);
  }

  function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const monthName = new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{monthName}</h2>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map((day) => (
            <div key={day} className="text-center font-bold text-gray-700 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="bg-gray-50 h-24 rounded"></div>;
            }

            const dateStr = formatDate(new Date(year, month, day));
            const hasEvents = hasEvent(dateStr);

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-24 p-2 rounded border-2 text-left transition-colors ${
                  hasEvents
                    ? "bg-yellow-200 border-yellow-400 hover:bg-yellow-300"
                    : "bg-white border-gray-200 hover:border-yellow-300"
                } ${selectedDate === dateStr ? "ring-2 ring-yellow-500" : ""}`}
              >
                <div className="font-bold text-gray-900">{day}</div>
                {hasEvents && <div className="text-xs text-yellow-700 mt-1">📌 Event</div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderWeekView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();

    const dayOfWeek = currentDate.getDay();
    const weekStart = new Date(year, month, date - dayOfWeek);

    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    const weekLabel = `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Week of {weekLabel}</h2>
        <div className="space-y-2">
          {days.map((d, idx) => {
            const dateStr = formatDate(d);
            const dayEvents = eventsList.filter((e) => e.event_date === dateStr);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
                className={`w-full p-4 rounded-lg text-left transition-colors border-2 ${
                  dayEvents.length > 0
                    ? "bg-yellow-100 border-yellow-400 hover:bg-yellow-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                } ${selectedDate === dateStr ? "ring-2 ring-yellow-500" : ""}`}
              >
                <div className="font-bold text-gray-900">
                  {dayNames[d.getDay()]} - {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                {dayEvents.length > 0 && (
                  <div className="text-sm text-yellow-700 mt-1">
                    {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}: {dayEvents[0].headline}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderYearView() {
    const year = currentDate.getFullYear();
    const months = [];

    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(year, m, 1);
      const monthEvents = eventsList.filter((e) =>
        e.event_date.startsWith(`${year}-${String(m + 1).padStart(2, "0")}`)
      );
      months.push({ date: monthDate, events: monthEvents });
    }

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{year}</h2>
        <div className="grid grid-cols-3 gap-4">
          {months.map((m, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentDate(m.date)}
              className={`p-4 rounded-lg text-left border-2 transition-colors ${
                view === "month" && currentDate.getMonth() === idx && currentDate.getFullYear() === year
                  ? "bg-yellow-200 border-yellow-400"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="font-bold text-gray-900">
                {m.date.toLocaleString("default", { month: "long" })}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {m.events.length} event{m.events.length !== 1 ? "s" : ""}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-yellow-400 p-6 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">WASP Events</h1>
          <p className="text-gray-600 mt-1">Upcoming events from our community</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Controls */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setView("month")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              view === "month"
                ? "bg-yellow-400 text-gray-900"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              view === "week"
                ? "bg-yellow-400 text-gray-900"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView("year")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              view === "year"
                ? "bg-yellow-400 text-gray-900"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Year
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setSortBy("date")}
              className={`px-4 py-2 rounded-lg text-sm ${
                sortBy === "date" ? "bg-blue-500 text-white" : "bg-white text-gray-700"
              }`}
            >
              📅 Date
            </button>
            <button
              onClick={() => setSortBy("country")}
              className={`px-4 py-2 rounded-lg text-sm ${
                sortBy === "country" ? "bg-blue-500 text-white" : "bg-white text-gray-700"
              }`}
            >
              🌍 Country
            </button>
            <button
              onClick={() => setSortBy("association")}
              className={`px-4 py-2 rounded-lg text-sm ${
                sortBy === "association" ? "bg-blue-500 text-white" : "bg-white text-gray-700"
              }`}
            >
              🏢 Org
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : view === "month" ? (
              renderMonthView()
            ) : view === "week" ? (
              renderWeekView()
            ) : (
              renderYearView()
            )}
          </div>

          {/* Sidebar - Selected date events */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {selectedDate && (
              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">
                  {new Date(selectedDate).toLocaleDateString("default", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>

                <div className="space-y-2">
                  {eventsList
                    .filter((e) => e.event_date === selectedDate)
                    .map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-left hover:bg-yellow-100 transition-colors"
                      >
                        <p className="font-bold text-gray-900 text-sm">{event.headline}</p>
                        <p className="text-xs text-gray-600">{event.associations?.name || "WASP"}</p>
                      </button>
                    ))}
                  {!eventsList.some((e) => e.event_date === selectedDate) && (
                    <p className="text-gray-500 text-sm">No events this day</p>
                  )}
                </div>
              </div>
            )}

            {/* List view */}
            {!selectedDate && (
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-4">Upcoming Events</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sortedEvents.slice(0, 10).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-left hover:bg-yellow-100 transition-colors"
                    >
                      <p className="font-bold text-gray-900 text-sm">{event.headline}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(event.event_date).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {selectedEvent.image_url && (
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.headline}
                  className="w-full h-96 object-cover rounded-lg mb-6"
                />
              )}

              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedEvent.headline}</h1>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>
                      <strong>By:</strong> {selectedEvent.associations?.name || "WASP"}
                    </span>
                    <span>
                      <strong>Date:</strong>{" "}
                      {new Date(selectedEvent.event_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
