-- Generate random passwords for all associations that don't have one
UPDATE associations
SET password = (
  SELECT (
    array['bear', 'wolf', 'eagle', 'tiger', 'lion', 'fox', 'deer', 'rabbit',
           'panda', 'otter', 'moose', 'zebra', 'dolphin', 'whale', 'shark', 'penguin']
    [1 + (random() * 15)::int]
  ) || LPAD((random() * 99)::int::text, 2, '0')
)
WHERE password IS NULL OR password = '';
