'use client';

import { useState } from 'react';
import { updateAssociation } from '@/app/admin/(dashboard)/associations/actions';

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
  password: string | null;
}

interface EditAssociationModalProps {
  isOpen: boolean;
  association: EditFormData | null;
  onClose: () => void;
  onSave: () => void;
}

export default function EditAssociationModal({
  isOpen,
  association,
  onClose,
  onSave
}: EditAssociationModalProps) {
  const [formData, setFormData] = useState<EditFormData | null>(association);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data when association changes
  if (association && formData?.id !== association.id) {
    setFormData(association);
    setError(null);
  }

  const handleChange = (field: keyof EditFormData, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    if (!formData) return;

    setLoading(true);
    setError(null);

    try {
      const result = await updateAssociation(formData.id, {
        name: formData.name || null,
        country: formData.country || null,
        city: formData.city || null,
        address: formData.address || null,
        website: formData.website || null,
        email: formData.email || null,
        phone: formData.phone || null,
        lat: formData.lat,
        lng: formData.lng,
        instagram: formData.instagram || null,
        email_secondary: formData.email_secondary || null,
        postal_code: formData.postal_code || null,
        contact_person: formData.contact_person || null,
        extra_details: formData.extra_details || null,
        password: formData.password || null,
      });

      if (!result.success) {
        setError(result.error || 'Failed to update');
        return;
      }

      // Close modal and reload page to refresh data
      onClose();
      setTimeout(() => window.location.reload(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white p-6 shadow-xl w-full max-w-md mx-4">
        <h2 className="text-lg font-bold mb-4">Edit Association</h2>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {/* Code (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Code</label>
            <input type="text" value={formData.code} disabled className="w-full rounded border border-gray-300 bg-gray-100 px-2 py-1.5 text-xs text-gray-500" />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
            <input type="text" placeholder="Organization name" value={formData.name ?? ''} onChange={(e) => handleChange('name', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
            <input type="text" placeholder="e.g., Italy" value={formData.country ?? ''} onChange={(e) => handleChange('country', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
            <input type="text" placeholder="e.g., Rome" value={formData.city ?? ''} onChange={(e) => handleChange('city', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
            <input type="text" placeholder="Street address" value={formData.address ?? ''} onChange={(e) => handleChange('address', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Website</label>
            <input type="url" placeholder="https://example.com" value={formData.website ?? ''} onChange={(e) => handleChange('website', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" placeholder="contact@example.com" value={formData.email ?? ''} onChange={(e) => handleChange('email', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Secondary Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Secondary Email</label>
            <input type="email" placeholder="secondary@example.com" value={formData.email_secondary ?? ''} onChange={(e) => handleChange('email_secondary', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
            <input type="tel" placeholder="+1 (555) 000-0000" value={formData.phone ?? ''} onChange={(e) => handleChange('phone', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Latitude */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Latitude</label>
            <input type="number" step="0.0001" placeholder="41.8719" value={formData.lat ?? ''} onChange={(e) => handleChange('lat', e.target.value === '' ? null : parseFloat(e.target.value))} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Longitude */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Longitude</label>
            <input type="number" step="0.0001" placeholder="12.5674" value={formData.lng ?? ''} onChange={(e) => handleChange('lng', e.target.value === '' ? null : parseFloat(e.target.value))} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Instagram</label>
            <input type="text" placeholder="@handle" value={formData.instagram ?? ''} onChange={(e) => handleChange('instagram', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Code</label>
            <input type="text" placeholder="00100" value={formData.postal_code ?? ''} onChange={(e) => handleChange('postal_code', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Person</label>
            <input type="text" placeholder="Name or title" value={formData.contact_person ?? ''} onChange={(e) => handleChange('contact_person', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <input type="text" placeholder="System-generated or custom" value={formData.password ?? ''} onChange={(e) => handleChange('password', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none font-mono" />
          </div>

          {/* Extra Details */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Extra Details</label>
            <textarea placeholder="Additional notes or information" value={formData.extra_details ?? ''} onChange={(e) => handleChange('extra_details', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none" rows={2} />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded bg-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
