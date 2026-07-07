'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function updateAssociation(
  id: string,
  data: {
    name?: string | null;
    country?: string | null;
    city?: string | null;
    address?: string | null;
    website?: string | null;
    email?: string | null;
    phone?: string | null;
    lat?: number | null;
    lng?: number | null;
    instagram?: string | null;
    email_secondary?: string | null;
    postal_code?: string | null;
    contact_person?: string | null;
    extra_details?: string | null;
  }
) {
  const updateData: Record<string, any> = {};

  // Only include fields that are provided
  if (data.name !== undefined) updateData.name = data.name;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.lat !== undefined) updateData.lat = data.lat;
  if (data.lng !== undefined) updateData.lng = data.lng;
  if (data.instagram !== undefined) updateData.instagram = data.instagram;
  if (data.email_secondary !== undefined) updateData.email_secondary = data.email_secondary;
  if (data.postal_code !== undefined) updateData.postal_code = data.postal_code;
  if (data.contact_person !== undefined) updateData.contact_person = data.contact_person;
  if (data.extra_details !== undefined) updateData.extra_details = data.extra_details;

  const { error } = await supabaseAdmin
    .from('associations')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
