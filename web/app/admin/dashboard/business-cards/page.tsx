"use client";

import { useEffect, useState } from "react";

interface BusinessCard {
  id: string;
  card_id: string;
  nickname: string;
  business_name: string;
  partita_iva: string;
  email: string;
  country_code: string;
  status: "pending" | "active" | "suspended" | "rejected";
  email_verified: boolean;
  created_at: string;
  verified_at: string | null;
}

export default function BusinessCardsAdminPage() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  async function fetchCards() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/business-cards");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCards(data.cards || []);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(cardId: string, newStatus: string) {
    setActionInProgress(cardId);
    try {
      const res = await fetch(`/api/admin/business-cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, status: newStatus as any } : card
        )
      );
      setSelectedCard(null);
    } catch (error) {
      console.error("Error updating card:", error);
      alert("Errore nell'aggiornamento. Riprova.");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleDelete(cardId: string) {
    if (!confirm("Sei sicuro di voler eliminare questa card?")) return;

    setActionInProgress(cardId);
    try {
      const res = await fetch(`/api/admin/business-cards/${cardId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setCards((prev) => prev.filter((card) => card.id !== cardId));
      setSelectedCard(null);
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Errore nell'eliminazione. Riprova.");
    } finally {
      setActionInProgress(null);
    }
  }

  const filteredCards = filterStatus
    ? cards.filter((card) => card.status === filterStatus)
    : cards;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
    rejected: "bg-gray-100 text-gray-800",
  };

  const statusLabels: Record<string, string> = {
    pending: "In Sospeso",
    active: "Attiva",
    suspended: "Sospesa",
    rejected: "Rifiutata",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WASP CARD Amici degli Animali</h1>
        <p className="mt-1 text-gray-600">
          Gestisci le card di business per Amici degli Animali
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Totale</p>
          <p className="text-2xl font-bold">{cards.length}</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">In Sospeso</p>
          <p className="text-2xl font-bold">
            {cards.filter((c) => c.status === "pending").length}
          </p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">Attive</p>
          <p className="text-2xl font-bold">
            {cards.filter((c) => c.status === "active").length}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Sospese</p>
          <p className="text-2xl font-bold">
            {cards.filter((c) => c.status === "suspended").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterStatus(null)}
          className={`px-3 py-1 rounded text-sm font-medium ${
            filterStatus === null
              ? "bg-black text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Tutte
        </button>
        {(["pending", "active", "suspended", "rejected"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                filterStatus === status
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {statusLabels[status]}
            </button>
          )
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Card ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Attività
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Data
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCards.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Nessuna card trovata
                </td>
              </tr>
            ) : (
              filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-bold">
                    {card.card_id}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{card.business_name}</div>
                    <div className="text-xs text-gray-500">{card.nickname}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{card.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        statusColors[card.status]
                      }`}
                    >
                      {statusLabels[card.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(card.created_at).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => setSelectedCard(card)}
                      className="text-blue-600 hover:underline"
                    >
                      Dettagli
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{selectedCard.card_id}</h2>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Attività</p>
                <p className="font-semibold">{selectedCard.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nickname</p>
                <p className="font-semibold">{selectedCard.nickname}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{selectedCard.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Partita IVA</p>
                <p className="font-semibold">{selectedCard.partita_iva}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Paese</p>
                  <p className="font-semibold">{selectedCard.country_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email Verificata</p>
                  <p className="font-semibold">
                    {selectedCard.email_verified ? "✓ Sì" : "✗ No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 border-t pt-4">
              {selectedCard.status !== "active" && (
                <button
                  onClick={() => handleStatusChange(selectedCard.id, "active")}
                  disabled={actionInProgress === selectedCard.id}
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  Approva
                </button>
              )}
              {selectedCard.status !== "suspended" && (
                <button
                  onClick={() =>
                    handleStatusChange(selectedCard.id, "suspended")
                  }
                  disabled={actionInProgress === selectedCard.id}
                  className="w-full rounded-md bg-orange-600 px-4 py-2 text-white font-semibold hover:bg-orange-700 disabled:opacity-50"
                >
                  Sospendi
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedCard.id)}
                disabled={actionInProgress === selectedCard.id}
                className="w-full rounded-md bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
