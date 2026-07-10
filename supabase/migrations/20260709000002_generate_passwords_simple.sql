-- Generate simple passwords for all associations without one
-- Format: word + 2 digits (e.g., bear53, tiger42)
UPDATE associations
SET password = (
  CASE ((RANDOM() * 15)::INT % 16)
    WHEN 0 THEN 'bear'
    WHEN 1 THEN 'wolf'
    WHEN 2 THEN 'eagle'
    WHEN 3 THEN 'tiger'
    WHEN 4 THEN 'lion'
    WHEN 5 THEN 'fox'
    WHEN 6 THEN 'deer'
    WHEN 7 THEN 'rabbit'
    WHEN 8 THEN 'panda'
    WHEN 9 THEN 'otter'
    WHEN 10 THEN 'moose'
    WHEN 11 THEN 'zebra'
    WHEN 12 THEN 'dolphin'
    WHEN 13 THEN 'whale'
    WHEN 14 THEN 'shark'
    ELSE 'penguin'
  END || LPAD((RANDOM() * 99)::INT::TEXT, 2, '0')
)
WHERE password IS NULL OR password = '';
