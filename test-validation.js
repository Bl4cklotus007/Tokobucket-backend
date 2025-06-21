import { body, validationResult } from "express-validator";

// Test the validation logic directly
const testValidation = () => {
  console.log("Testing validation logic...");

  // Test cases
  const testCases = [
    { value: "true", expected: true },
    { value: "false", expected: true },
    { value: true, expected: true },
    { value: false, expected: true },
    { value: undefined, expected: true },
    { value: "", expected: true },
    { value: "invalid", expected: false },
    { value: 1, expected: false },
    { value: 0, expected: false },
  ];

  testCases.forEach(({ value, expected }) => {
    const validation = body("is_featured")
      .optional()
      .custom((val) => {
        console.log(`Testing value: ${val} (type: ${typeof val})`);
        if (val === undefined || val === "") {
          console.log("Value is undefined or empty, returning true");
          return true;
        }
        // Handle both string and boolean values from FormData
        if (typeof val === "string") {
          const isValid = val === "true" || val === "false";
          console.log(`String validation result: ${isValid}`);
          return isValid;
        }
        const isValid = val === true || val === false;
        console.log(`Boolean validation result: ${isValid}`);
        return isValid;
      })
      .withMessage("Status unggulan harus berupa boolean");

    // Simulate validation
    const req = { body: { is_featured: value } };
    const res = {};
    const next = () => {};

    // Run validation
    validation(req, res, next);

    // Check result
    const errors = validationResult(req);
    const isValid = errors.isEmpty();

    console.log(
      `Value: ${value} (${typeof value}) - Expected: ${expected}, Got: ${isValid} - ${
        isValid === expected ? "✅" : "❌"
      }`
    );
  });
};

testValidation();
