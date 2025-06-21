import { runQuery, getAllRows } from './config/database.js';

async function updateCategory() {
  try {
    console.log('🔄 Updating category from "wisuda" to "bucket"...');
    
    // Update products
    const productResult = await runQuery(
      "UPDATE products SET category = 'bucket' WHERE category = 'wisuda'"
    );
    console.log(`✅ Updated ${productResult.affectedRows} products`);
    
    // Update galleries
    const galleryResult = await runQuery(
      "UPDATE galleries SET tag = 'bucket' WHERE tag = 'wisuda'"
    );
    console.log(`✅ Updated ${galleryResult.affectedRows} gallery items`);
    
    // Verify changes
    console.log('\n🔍 Verifying changes...');
    const bucketProducts = await getAllRows("SELECT id, name, category FROM products WHERE category = 'bucket'");
    const bucketGalleries = await getAllRows("SELECT id, title, tag FROM galleries WHERE tag = 'bucket'");
    
    console.log(`📦 Products with 'bucket' category: ${bucketProducts.length}`);
    bucketProducts.forEach(product => {
      console.log(`   - ${product.name} (ID: ${product.id})`);
    });
    
    console.log(`🖼️ Gallery items with 'bucket' tag: ${bucketGalleries.length}`);
    bucketGalleries.forEach(gallery => {
      console.log(`   - ${gallery.title} (ID: ${gallery.id})`);
    });
    
    console.log('\n✅ Category update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating category:', error.message);
  }
}

updateCategory(); 