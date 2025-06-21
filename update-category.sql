-- Update existing products from 'wisuda' to 'bucket' category
UPDATE products SET category = 'bucket' WHERE category = 'wisuda';

-- Update gallery tags from 'wisuda' to 'bucket'
UPDATE galleries SET tag = 'bucket' WHERE tag = 'wisuda';

-- Verify the changes
SELECT 'Products updated:' as info;
SELECT id, name, category FROM products WHERE category = 'bucket';

SELECT 'Gallery items updated:' as info;
SELECT id, title, tag FROM galleries WHERE tag = 'bucket'; 