import fetch from 'node-fetch';
import FormData from 'form-data';

const API_BASE_URL = 'http://localhost:5000';

async function testSimpleUpdate() {
  try {
    console.log('Testing simple update with is_featured...');
    
    // First, login to get a token
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Login successful, got token');

    // Get a product to update
    const productsResponse = await fetch(`${API_BASE_URL}/api/products/admin/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!productsResponse.ok) {
      throw new Error(`Failed to get products: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    if (productsData.data.length === 0) {
      throw new Error('No products found to update');
    }

    const productId = productsData.data[0].id;
    console.log(`✅ Found product with ID: ${productId}`);

    // Test updating with is_featured as string 'true'
    const formData = new FormData();
    formData.append('is_featured', 'true');

    console.log('Sending update request with is_featured: true');
    const updateResponse = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log(`Response status: ${updateResponse.status}`);
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('❌ Update failed:', errorData);
      return;
    }

    const updateData = await updateResponse.json();
    console.log('✅ Update successful:', updateData);

    // Test updating with is_featured as string 'false'
    const formData2 = new FormData();
    formData2.append('is_featured', 'false');

    console.log('Sending update request with is_featured: false');
    const updateResponse2 = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData2.getHeaders()
      },
      body: formData2
    });

    console.log(`Response status: ${updateResponse2.status}`);
    
    if (!updateResponse2.ok) {
      const errorData = await updateResponse2.json();
      console.error('❌ Second update failed:', errorData);
      return;
    }

    const updateData2 = await updateResponse2.json();
    console.log('✅ Second update successful:', updateData2);

    console.log('🎉 All tests passed! is_featured validation is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleUpdate(); 