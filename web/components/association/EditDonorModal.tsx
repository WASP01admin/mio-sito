'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

interface EditDonorModalProps {
  isOpen: boolean;
  donor: DonorRow | null;
  onClose: () => void;
  onSave: () => void;
}

export default function EditDonorModal({ isOpen, donor, onClose, onSave }: EditDonorModalProps) {
  const [form, setForm] = useState<DonorRow | null>(donor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (donor) {
      setForm(donor);
    }
  }, [donor, isOpen]);

  if (!isOpen || !form) return null;

  const handleChange = (field: keyof DonorRow, value: any) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async () => {
    if (!form) return;

    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('donors')
        .update({
          name: form.name,
          city: form.city,
          address: form.address,
          lat: form.lat,
          lng: form.lng,
          email: form.email,
          phone: form.phone,
          website: form.website,
        })
        .eq('id', form.id);

      if (dbError) {
        setError(dbError.message);
        return;
      }

      onClose();
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!form || !confirm('Are you sure you want to delete this donor?')) return;

    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('donors')
        .delete()
        .eq('id', form.id);

      if (dbError) {
        setError(dbError.message);
        return;
      }

      onClose();
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white p-6 shadow-xl w-full max-w-md mx-4 max-h-96 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Edit Donor</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Code</label>
            <input
              type="text"
              value={form.code}
              disabled
              className="w-full rounded border border-gray-300 bg-gray-100 px-2 py-1.5 text-xs text-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={form.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={form.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={form.lat || ''}
                onChange={(e) => handleChange('lat', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={form.lng || ''}
                onChange={(e) => handleChange('lng', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Website</label>
            <input
              type="url"
              value={form.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded bg-red-50 p-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded bg-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Delete
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
