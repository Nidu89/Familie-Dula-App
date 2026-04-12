-- Fix umlaut in achievement title: Fruehaufsteher → Frühaufsteher
UPDATE achievements SET title = 'Frühaufsteher' WHERE slug = 'fruehaufsteher' AND title = 'Fruehaufsteher';
