-- Create WASP association account for admin event creation
INSERT INTO associations (id, name, password_hash, created_at, updated_at)
VALUES (
  'ITAWASPHQ',
  'World Animal Solidarity Project',
  'd8b457249677284db2f90f18ddc96909:09c4e41b7b5d61ef2f2c1ce1ec97be7eaca34f2eb7ac0e1947695755bcf9b6eab001f8bb6d3ea1d223119f42dc882c4722dd640649a254f99386c7394e5a7279',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = 'World Animal Solidarity Project',
  password_hash = 'd8b457249677284db2f90f18ddc96909:09c4e41b7b5d61ef2f2c1ce1ec97be7eaca34f2eb7ac0e1947695755bcf9b6eab001f8bb6d3ea1d223119f42dc882c4722dd640649a254f99386c7394e5a7279'
WHERE associations.id = 'ITAWASPHQ';
