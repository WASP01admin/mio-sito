"use client";

import Link from "next/link";

export default function DonorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      <div className="bg-white border-b-4 border-yellow-400 p-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Donor Network</h1>
          <Link href="/private-area/dashboard" className="text-blue-600 hover:underline">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Donor</h2>
          <p className="text-gray-600">Form component will go here</p>
        </div>
      </div>
    </div>
  );
}
