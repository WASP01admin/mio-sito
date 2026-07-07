import "server-only";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabase-admin";

const PHOTO_BUCKET = "member-photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

export async function uploadMemberPhoto(file: File): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Photo exceeds the 5MB size limit.");
  }

  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : "";
  const path = `${randomUUID()}${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) throw error;

  return path;
}

const CHAT_IMAGE_BUCKET = "chat-images";
const MAX_CHAT_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_DAILY_IMAGES = 50; // Max 50 images per day per user
const MAX_HOURLY_IMAGES = 10; // Max 10 images per hour per user
const MAX_USER_STORAGE_BYTES = 500 * 1024 * 1024; // 500MB per user
const ALLOWED_CHAT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function uploadChatImage(file: File, userProfileId: string): Promise<string> {
  // Type check
  if (!ALLOWED_CHAT_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed.");
  }

  // Size check
  if (file.size > MAX_CHAT_IMAGE_BYTES) {
    throw new Error("Image exceeds the 5MB size limit.");
  }

  // Get user's upload stats
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const { data: dailyUploads, error: dailyError } = await supabaseAdmin
    .from("chat_image_uploads")
    .select("id, file_size_bytes")
    .eq("user_profile_id", userProfileId)
    .gte("uploaded_at", oneDayAgo.toISOString());

  if (dailyError) throw dailyError;

  // Daily image count limit
  if (dailyUploads.length >= MAX_DAILY_IMAGES) {
    throw new Error(`Daily limit of ${MAX_DAILY_IMAGES} images reached. Try again tomorrow.`);
  }

  // Hourly image count limit
  const { data: hourlyUploads, error: hourlyError } = await supabaseAdmin
    .from("chat_image_uploads")
    .select("id")
    .eq("user_profile_id", userProfileId)
    .gte("uploaded_at", oneHourAgo.toISOString());

  if (hourlyError) throw hourlyError;

  if (hourlyUploads.length >= MAX_HOURLY_IMAGES) {
    throw new Error(`Hourly limit of ${MAX_HOURLY_IMAGES} images reached. Please slow down.`);
  }

  // Total storage quota
  const totalBytes = dailyUploads.reduce((sum, upload) => sum + upload.file_size_bytes, 0);
  if (totalBytes + file.size > MAX_USER_STORAGE_BYTES) {
    throw new Error(
      `Storage quota of ${Math.round(MAX_USER_STORAGE_BYTES / 1024 / 1024)}MB exceeded. Old images will auto-delete after 2 days.`
    );
  }

  // Upload file
  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : "";
  const path = `${randomUUID()}${extension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(CHAT_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  // Record upload in tracking table
  const { error: trackError } = await supabaseAdmin
    .from("chat_image_uploads")
    .insert({
      user_profile_id: userProfileId,
      file_path: path,
      file_size_bytes: file.size,
    });

  if (trackError) throw trackError;

  return path;
}

export function chatImagePublicUrl(path: string): string {
  return supabaseAdmin.storage.from(CHAT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
