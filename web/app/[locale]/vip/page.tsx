import { supabaseAdmin } from "@/lib/supabase-admin";
import VIPList from "@/components/vip/VIPList";

interface VIP {
  id: string;
  first_name: string;
  surname_initial: string;
  nationality_code: string;
  bio: string;
  image_url: string;
}

async function getVIPs(): Promise<VIP[]> {
  const { data, error } = await supabaseAdmin
    .from("vips")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching VIPs:", error);
    return [];
  }

  return data || [];
}

export default async function VIPPage() {
  const vips = await getVIPs();

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-b-4 border-yellow-400 p-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">WASP VIPs</h1>
        <p className="text-gray-700 text-lg max-w-2xl mx-auto">
          These individuals have been honored with WASP VIP cards as recognition for their dedication to animal welfare,
          plant-based living, and promoting solidarity for our animal friends. They did not request this honor — it was our
          spontaneous gift to celebrate their remarkable contributions.
        </p>
      </div>

      {/* VIPs List */}
      <div className="p-8 max-w-5xl mx-auto">
        {vips.length === 0 ? (
          <p className="text-center text-gray-600">Coming soon...</p>
        ) : (
          <VIPList vips={vips} />
        )}
      </div>
    </main>
  );
}

