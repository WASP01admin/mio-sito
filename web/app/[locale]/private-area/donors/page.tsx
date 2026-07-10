"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AddDonorFormAssociation from "@/components/association/AddDonorFormAssociation";
import EditDonorModal from "@/components/association/EditDonorModal";

interface DonorRow {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

export default function DonorsPage() {
  const [donors, setDonors] = useState<DonorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [associationCountry, setAssociationCountry] = useState<string>("");
  const [editingDonor, setEditingDonor] = useState<DonorRow | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/association/me");
        const data = await res.json();

        if (!data.ok) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        setAssociationCountry(data.country);

        const { data: donorData, error: dbError } = await supabase
          .from("donors")
          .select("id, code, name, city, country, address, lat, lng, email, phone, website")
          .eq("country", data.country)
          .order("code", { ascending: true });

        if (dbError) {
          setError(`Failed to load donors: ${dbError.message}`);
        } else {
          setDonors((donorData as DonorRow[]) || []);
        }
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDonorAdded = () => {
    window.location.reload();
  };

  const handleEditClick = (donor: DonorRow) => {
    setEditingDonor(donor);
    setIsEditModalOpen(true);
  };

  const handleModalSave = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading donor network...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      <div className="bg-white border-b-4 border-yellow-400 p-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Donor Network</h1>
            <p className="text-gray-600 mt-1">Manage donors in {associationCountry}</p>
          </div>
          <Link href="/private-area/dashboard" className="text-blue-600 hover:underline font-semibold">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Donor</h2>
          <AddDonorFormAssociation onDonorAdded={handleDonorAdded} />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Donors ({donors.length})</h2>
          {donors.length === 0 ? (
            <p className="text-gray-600 text-center py-12">No donors yet. Add your first donor above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Code</th>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">City</th>
                    <th className="px-4 py-3 text-left font-semibold">Coordinates</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map((donor) => (
                    <tr key={donor.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-yellow-700">{donor.code}</td>
                      <td className="px-4 py-3">{donor.name}</td>
                      <td className="px-4 py-3">{donor.city}</td>
                      <td className="px-4 py-3 text-xs">
                        {donor.lat && donor.lng ? `${donor.lat.toFixed(4)}, ${donor.lng.toFixed(4)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {donor.lat && donor.lng ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">ON MAP ✓</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">OFF MAP</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEditClick(donor)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-xs underline"
                        >
                          EDIT
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <EditDonorModal
        isOpen={isEditModalOpen}
        donor={editingDonor}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDonor(null);
        }}
        onSave={handleModalSave}
      />
    </div>
  );
}
