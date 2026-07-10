-- Generate passwords using MD5 hash of code + random
UPDATE associations
SET password = SUBSTR(MD5(code || RANDOM()::TEXT), 1, 12)
WHERE password IS NULL OR password = '';
