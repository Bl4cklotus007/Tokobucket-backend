import fetch from "node-fetch";
import FormData from "form-data";

const API_BASE_URL = "http://localhost:5000";

async function testApiValidation() {
  try {
    console.log("Testing API validation...");

    // First, login to get a token
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "admin",
        password: "password",
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log("✅ Login successful");

    // Get a product to update
    const productsResponse = await fetch(
      `${API_BASE_URL}/api/products/admin/all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!productsResponse.ok) {
      throw new Error(`Failed to get products: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    if (productsData.data.length === 0) {
      throw new Error("No products found to update");
    }

    const productId = productsData.data[0].id;
    console.log(`✅ Found product with ID: ${productId}`);

    // Test with different is_featured values
    const testValues = ["true", "false", "invalid", "1", "0"];

    for (const value of testValues) {
      console.log(`\n--- Testing with is_featured: "${value}" ---`);

      const formData = new FormData();
      formData.append("is_featured", value);

      // Log what we're sending
      console.log(`Sending FormData with is_featured: ${value}`);

      const updateResponse = await fetch(
        `${API_BASE_URL}/api/products/${productId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            ...formData.getHeaders(),
          },
          body: formData,
        }
      );

      console.log(`Response status: ${updateResponse.status}`);

      const responseData = await updateResponse.json();

      if (updateResponse.ok) {
        console.log("✅ Success:", responseData);
      } else {
        console.log("❌ Error:", responseData);
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testApiValidation();
