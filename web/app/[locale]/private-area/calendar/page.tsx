"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface CalendarEvent {
  id: string;
  headline: string;
  description: string;
  image_url: string;
  event_date: string;
}

type ViewType = "month" | "week" | "year";

export default function CalendarPage() {
  const params = useParams();
  const locale = params.locale as string;

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
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

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

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();

    const headline = (e.currentTarget.querySelector('[placeholder="Headline"]') as HTMLInputElement)?.value || "";
    const description = (e.currentTarget.querySelector('[placeholder="Description"]') as HTMLTextAreaElement)?.value || "";
    const event_date = (e.currentTarget.querySelector('[type="date"]') as HTMLInputElement)?.value || "";

    if (!headline.trim() || !description.trim() || !event_date) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = formData.image_url;

      // Upload image if provided
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", imageFile);

        const uploadRes = await fetch("/api/association/event-upload-image", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          throw new Error("Image upload failed");
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.imageUrl;
      }

      // Create event
      const response = await fetch("/api/association/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          description,
          image_url: imageUrl,
          event_date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Event creation failed:", errorData);
        throw new Error(errorData.error || "Failed to create event");
      }

      // Reset form and refresh
      setFormData({
        headline: "",
        description: "",
        image_url: "",
        event_date: "",
      });
      setImageFile(null);
      setShowForm(false);
      await fetchEvents();
      alert("Event created successfully!");
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
    } finally {
      setSubmitting(false);
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Week view
  function renderWeekView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();

    // Get first day of week (Sunday)
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
            const dayEvents = events.filter((e) => e.event_date === dateStr);

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

  // Year view
  function renderYearView() {
    const year = currentDate.getFullYear();
    const months = [];

    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(year, m, 1);
      const monthEvents = events.filter((e) => e.event_date.startsWith(`${year}-${String(m + 1).padStart(2, "0")}`));
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
            href={`/${locale}/private-area/dashboard`}
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
            ) : view === "month" ? (
              renderMonthView()
            ) : view === "week" ? (
              renderWeekView()
            ) : (
              renderYearView()
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
                onSubmit={handleCreateEvent}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
                <input
                  type="date"
                  value={formData.event_date || selectedDate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, event_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  required
                  disabled={submitting}
                />

                {/* Optional image upload */}
                <label className="block text-xs text-gray-600">
                  📸 Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-xs"
                  disabled={submitting}
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 text-white font-bold py-2 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Event"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
