"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  headline: string;
  description: string;
  image_url: string;
  event_date: string;
}

type ViewType = "month" | "week" | "year";

export default function CalendarPage() {
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    headline: "",
    description: "",
    image_url: "",
    event_date: "",
  });
  const [loading, setLoading] = useState(true);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const response = await fetch("/api/association/events");
      const data = await response.json();
      setEvents(data || []);
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

  function hasEvent(dateStr: string): boolean {
    return events.some((e) => e.event_date === dateStr);
  }

  function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  // Month view
  function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    // Month name
    const monthName = new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{monthName}</h2>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center font-bold text-gray-700 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            if (day === null) {
              return (
                <div key={`empty-${idx}`} className="bg-gray-50 h-24 rounded"></div>
              );
            }

            const dateStr = formatDate(
              new Date(year, month, day)
            );
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
                {hasEvents && (
                  <div className="text-xs text-yellow-700 mt-1">📌 Event</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-yellow-400 p-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Events Calendar</h1>
          <Link
            href="/private-area/dashboard"
            className="text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* View selector */}
        <div className="mb-6 flex gap-2">
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
            disabled
            className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
          >
            Week (Coming soon)
          </button>
          <button
            onClick={() => setView("year")}
            disabled
            className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
          >
            Year (Coming soon)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            {/* Navigation */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
                  )
                }
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="text-sm text-blue-600 hover:underline"
              >
                Today
              </button>
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
                  )
                }
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                →
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading...</div>
            ) : (
              renderMonthView()
            )}
          </div>

          {/* Sidebar */}
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

                {/* Events for selected date */}
                <div className="space-y-2">
                  {events
                    .filter((e) => e.event_date === selectedDate)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg"
                      >
                        <p className="font-bold text-gray-900 text-sm">
                          {event.headline}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      </div>
                    ))}
                  {!events.some((e) => e.event_date === selectedDate) && (
                    <p className="text-gray-500 text-sm">No events this day</p>
                  )}
                </div>
              </div>
            )}

            {/* Add event button */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              {showForm ? "Cancel" : "Add Event"}
            </button>

            {/* Event form */}
            {showForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // TODO: Handle event creation
                  console.log("Create event:", formData);
                }}
                className="mt-4 space-y-3"
              >
                <input
                  type="text"
                  placeholder="Headline"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData({ ...formData, headline: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  rows={3}
                  required
                />
                <input
                  type="date"
                  value={formData.event_date || selectedDate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, event_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  required
                />
                <input
                  type="url"
                  placeholder="Image URL"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-green-700"
                >
                  Create Event
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
