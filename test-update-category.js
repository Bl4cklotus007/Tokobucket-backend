import fetch from 'node-fetch';
import FormData from 'form-data';

const API_BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AYmFsb24tdGVnYWwuY29tIiwicm9sZSI6InN1cGVyYWRtaW4iLCJpYXQiOjE3NTQ4MDQxMzQsImV4cCI6MTc1NDg5MDUzNH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testUpdateCategory() {
  try {
    console.log('🧪 Testing category update...');
    
    // Test 1: Update product category to "pernikahan"
    const formData = new FormData();
    formData.append('category', 'pernikahan');
    
    const response = await fetch(`${API_BASE_URL}/api/products/11`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error response:', errorData);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Success response:', result);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUpdateCategory(); 