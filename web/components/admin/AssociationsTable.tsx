'use client';

import { useState } from 'react';
import EditAssociationModal from './EditAssociationModal';

interface AssociationRow {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  email: string | null;
  email_secondary: string | null;
  phone: string | null;
  website: string | null;
  facebook_url: string | null;
  contact_person: string | null;
}

interface EditFormData {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string | null;
  address: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  instagram: string | null;
  email_secondary: string | null;
  postal_code: string | null;
  contact_person: string | null;
  extra_details: string | null;
}

interface AssociationsTableProps {
  associations: AssociationRow[];
}

export default function AssociationsTable({ associations }: AssociationsTableProps) {
  const [editingAssociation, setEditingAssociation] = useState<EditFormData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditClick = (association: AssociationRow) => {
    setEditingAssociation({
      id: association.id,
      code: association.code,
      name: association.name,
      country: association.country || '',
      city: association.city,
      address: association.address,
      website: association.website,
      email: association.email,
      phone: association.phone,
      lat: association.lat,
      lng: association.lng,
      instagram: null,
      email_secondary: association.email_secondary,
      postal_code: null,
      contact_person: association.contact_person,
      extra_details: null,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // Page will reload automatically when modal closes
    // (triggered by EditAssociationModal)
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2 w-12">#</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Map</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Country</th>
              <th className="px-3 py-2">Address</th>
              <th className="px-3 py-2">Coordinates</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Secondary email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Website</th>
              <th className="px-3 py-2">Facebook</th>
              <th className="px-3 py-2">Reference person</th>
              <th className="px-3 py-2 text-center sticky right-0 bg-gray-50 border-l border-gray-200 z-10">Action</th>
            </tr>
          </thead>
          <tbody>
            {associations.map((a, index) => {
              const onMap = a.lat != null && a.lng != null;
              return (
                <tr key={a.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 w-12 text-right font-mono text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs">{a.code}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      onMap
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {onMap ? "ON MAP" : "OFF MAP"}
                    </span>
                  </td>
                  <td className="px-3 py-2">{a.name}</td>
                  <td className="px-3 py-2">{a.city}</td>
                  <td className="px-3 py-2">{a.country ?? "—"}</td>
                  <td className="px-3 py-2">{a.address ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {a.lat != null && a.lng != null ? `${a.lat}, ${a.lng}` : "—"}
                  </td>
                  <td className="px-3 py-2">{a.email ?? "—"}</td>
                  <td className="px-3 py-2">{a.email_secondary ?? "—"}</td>
                  <td className="px-3 py-2">{a.phone ?? "—"}</td>
                  <td className="px-3 py-2">{a.website ?? "—"}</td>
                  <td className="px-3 py-2">{a.facebook_url ?? "—"}</td>
                  <td className="px-3 py-2">{a.contact_person ?? "—"}</td>
                  <td className="px-3 py-2 text-center sticky right-0 bg-white border-l border-gray-100">
                    <button
                      onClick={() => handleEditClick(a)}
                      className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EditAssociationModal
        isOpen={isModalOpen}
        association={editingAssociation}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
