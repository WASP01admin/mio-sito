-- Create main WASP association account with ITA0001
INSERT INTO associations (id, name, password_hash, created_at, updated_at)
VALUES (
  'ITA0001',
  'World Animal Solidarity Project',
  'ad7ef544fc0ed52bb34ed9aee23d7700:9133d52104ebeb077c9c4a1e0e4ab8e8d59b52e4d2c8fbed97c4c19ae03213b37f7bc3872566ca46ea939ca71d5696b0a1ec2e2fc238cd269c2e23185ab33871',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = 'World Animal Solidarity Project',
  password_hash = 'ad7ef544fc0ed52bb34ed9aee23d7700:9133d52104ebeb077c9c4a1e0e4ab8e8d59b52e4d2c8fbed97c4c19ae03213b37f7bc3872566ca46ea939ca71d5696b0a1ec2e2fc238cd269c2e23185ab33871'
WHERE associations.id = 'ITA0001';
