import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

async function testIsFeaturedValidation() {
  try {
    console.log('Testing is_featured validation...');
    
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

    // Test creating a product with is_featured as string 'true'
    const formData = new FormData();
    formData.append('name', 'Test Product');
    formData.append('description', 'Test description');
    formData.append('price', '100000');
    formData.append('category', 'bucket');
    formData.append('is_featured', 'true');

    const createResponse = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('❌ Create product failed:', errorData);
      return;
    }

    const createData = await createResponse.json();
    console.log('✅ Product created successfully:', createData);

    // Test updating the product with is_featured as string 'false'
    const updateFormData = new FormData();
    updateFormData.append('is_featured', 'false');

    const updateResponse = await fetch(`${API_BASE_URL}/api/products/${createData.data.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: updateFormData
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('❌ Update product failed:', errorData);
      return;
    }

    const updateData = await updateResponse.json();
    console.log('✅ Product updated successfully:', updateData);

    console.log('🎉 All tests passed! is_featured validation is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIsFeaturedValidation(); 