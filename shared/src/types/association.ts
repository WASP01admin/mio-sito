export interface Association {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string | null;
  address: string | null;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  extraDetails: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AssociationSearchResult {
  id: string;
  code: string;
  name: string;
  city: string;
}
