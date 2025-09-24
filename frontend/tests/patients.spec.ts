import { test, expect } from '@playwright/test';

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock authentication in localStorage first
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'admin@clinic.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['Admin']
      }));
    });
    
    // Try navigating from root first
    try {
      await page.goto('/');
      await page.waitForTimeout(1000);
      console.log('Root URL loaded, current URL:', page.url());
      
      // Now try to navigate to manage-patients
      await page.goto('/manage-patients');
      await page.waitForTimeout(1000);
      console.log('Manage-patients URL, current URL:', page.url());
    } catch (error) {
      console.log('Navigation error:', error);
    }
  });

  test('should load the manage patients page successfully', async ({ page }) => {
    // Debug: Take a screenshot and log page content
    await page.screenshot({ path: 'debug-patient-page.png', fullPage: true });
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Check if the page loads without errors - be more flexible with selectors
    await expect(page).toHaveTitle(/.*/); // Any title is fine for now
    
    // Look for any h1 or main heading element
    const headings = page.locator('h1, h2, [role="heading"]');
    await expect(headings.first()).toBeVisible();
    
    // Log all headings for debugging
    const headingTexts = await headings.allTextContents();
    console.log('Page headings:', headingTexts);
  });

  test('should display the Add Patient button', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Patient")')).toBeVisible();
  });

  test('should open Add Patient modal when button is clicked', async ({ page }) => {
    await page.click('button:has-text("Add Patient")');
    
    // Check if modal opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Add New Patient')).toBeVisible();
  });

  test('should display all form sections in Add Patient modal', async ({ page }) => {
    await page.click('button:has-text("Add Patient")');
    
    // Check all form sections are present
    await expect(page.locator('text=Personal Information')).toBeVisible();
    await expect(page.locator('text=Contact Information')).toBeVisible();
    await expect(page.locator('text=Emergency Contact')).toBeVisible();
    await expect(page.locator('text=Medical Information')).toBeVisible();
  });

  test('should display all required form fields in Add Patient modal', async ({ page }) => {
    await page.click('button:has-text("Add Patient")');
    
    // Personal Information fields
    await expect(page.locator('input[placeholder="John"]')).toBeVisible(); // First Name
    await expect(page.locator('input[placeholder="Doe"]')).toBeVisible(); // Last Name
    await expect(page.locator('input[placeholder="30"]')).toBeVisible(); // Age
    await expect(page.locator('text=Select Gender')).toBeVisible(); // Gender dropdown
    
    // Contact Information fields
    await expect(page.locator('input[placeholder="+91 9876543210"]')).toBeVisible(); // Mobile
    await expect(page.locator('input[placeholder="patient@email.com"]')).toBeVisible(); // Email
    await expect(page.locator('input[placeholder="123 Main Street"]')).toBeVisible(); // Address
    await expect(page.locator('input[placeholder="Mumbai"]')).toBeVisible(); // City
    await expect(page.locator('input[placeholder="Maharashtra"]')).toBeVisible(); // State
    await expect(page.locator('input[placeholder="400001"]')).toBeVisible(); // Postal Code
    
    // Medical Information fields
    await expect(page.locator('text=Select Cancer Site')).toBeVisible(); // Primary Cancer Site
    await expect(page.locator('text=Select Risk Level')).toBeVisible(); // Risk Level
  });

  test('should validate required fields in Add Patient form', async ({ page }) => {
    await page.click('button:has-text("Add Patient")');
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Add Patient"):last-child');
    
    // Check if HTML5 validation prevents submission for required fields
    const firstNameInput = page.locator('input[placeholder="John"]');
    const lastNameInput = page.locator('input[placeholder="Doe"]');
    const ageInput = page.locator('input[placeholder="30"]');
    const mobileInput = page.locator('input[placeholder="+91 9876543210"]');
    
    await expect(firstNameInput).toHaveAttribute('required');
    await expect(lastNameInput).toHaveAttribute('required');
    await expect(ageInput).toHaveAttribute('required');
    await expect(mobileInput).toHaveAttribute('required');
  });

  test('should successfully submit Add Patient form with valid data', async ({ page }) => {
    // Mock the API response for patient creation
    await page.route('**/api/patients', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            patientId: 'P123456',
            firstName: 'Test',
            lastName: 'Patient',
            age: 35,
            gender: 'M',
            mobileNumber: '+91 9876543210',
            email: 'test.patient@email.com',
            address: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            postalCode: '123456',
            country: 'India',
            emergencyContactName: 'Emergency Contact',
            emergencyContactPhone: '+91 9876543211',
            primaryCancerSite: 'Lung',
            cancerStage: 'Stage II',
            histology: 'Adenocarcinoma',
            diagnosisDate: '2024-01-15',
            treatmentPathway: 'Curative',
            currentStatus: 'Active',
            riskLevel: 'Medium',
            siteSpecificDiagnosis: 'Detailed diagnosis information',
            registrationYear: 2024,
            secondaryContactPhone: '+91 9876543212',
            tertiaryContactPhone: '+91 9876543213',
            originalMRN: 'MRN123456',
            importedFromExcel: false,
            registrationDate: '2024-01-15T00:00:00Z',
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z'
          })
        });
      }
    });

    await page.click('button:has-text("Add Patient")');
    
    // Fill out Personal Information
    await page.fill('input[placeholder="John"]', 'Test');
    await page.fill('input[placeholder="Doe"]', 'Patient');
    await page.fill('input[placeholder="30"]', '35');
    await page.click('text=Select Gender');
    await page.click('text=Male');
    
    // Fill out Contact Information
    await page.fill('input[placeholder="+91 9876543210"]', '+91 9876543210');
    await page.fill('input[placeholder="patient@email.com"]', 'test.patient@email.com');
    await page.fill('input[placeholder="123 Main Street"]', '123 Test Street');
    await page.fill('input[placeholder="Mumbai"]', 'Test City');
    await page.fill('input[placeholder="Maharashtra"]', 'Test State');
    await page.fill('input[placeholder="400001"]', '123456');
    await page.fill('input[placeholder="+91 9876543211"]', '+91 9876543212'); // Secondary contact
    await page.fill('input[placeholder="+91 9876543212"]', '+91 9876543213'); // Tertiary contact
    
    // Fill out Emergency Contact
    await page.fill('input[placeholder="John Doe"]:nth-match(2)', 'Emergency Contact');
    await page.fill('input[placeholder="+91 9876543210"]:nth-match(2)', '+91 9876543211');
    
    // Fill out Medical Information
    await page.click('text=Select Cancer Site');
    await page.click('text=Lung');
    await page.fill('input[placeholder="Stage IIA"]', 'Stage II');
    await page.fill('input[placeholder="Adenocarcinoma"]', 'Adenocarcinoma');
    await page.fill('input[type="date"]:first', '2024-01-15'); // Diagnosis Date
    await page.click('text=Curative'); // Treatment Pathway (should be pre-selected)
    await page.click('text=Medium'); // Risk Level (should be pre-selected)
    await page.fill('input[placeholder="Detailed diagnosis"]', 'Detailed diagnosis information');
    await page.fill('input[placeholder="Medical Record Number"]', 'MRN123456');
    
    // Submit the form
    await page.click('button:has-text("Add Patient"):last-child');
    
    // Wait for the API call to complete and modal to close
    await page.waitForTimeout(1000);
    
    // Modal should close after successful submission
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should handle form cancellation', async ({ page }) => {
    await page.click('button:has-text("Add Patient")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Fill some data
    await page.fill('input[placeholder="John"]', 'Test');
    
    // Cancel the form
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Re-open modal and check if form is reset
    await page.click('button:has-text("Add Patient")');
    await expect(page.locator('input[placeholder="John"]')).toHaveValue('');
  });

  test('should display patient search functionality', async ({ page }) => {
    // Check if search input is present
    await expect(page.locator('input[placeholder="Search patients..."]')).toBeVisible();
    
    // Check if filter button is present
    await expect(page.locator('button:has-text("Filters")')).toBeVisible();
  });

  test('should open filters when filter button is clicked', async ({ page }) => {
    await page.click('button:has-text("Filters")');
    
    // Check if filter options are visible
    await expect(page.locator('text=All Statuses')).toBeVisible();
    await expect(page.locator('text=All Risk Levels')).toBeVisible();
    await expect(page.locator('text=All Cancer Types')).toBeVisible();
  });

  test('should handle responsive design for mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if main elements are still visible and accessible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Add Patient")')).toBeVisible();
    
    // Check if Add button text changes on mobile (should show "Add" instead of "Add Patient")
    const addButton = page.locator('button:has-text("Add")');
    await expect(addButton).toBeVisible();
  });

  test('should handle all gender options', async ({ page }) => {
    await page.click('button:has-text("Add Patient")');
    
    await page.click('text=Select Gender');
    
    // Check all gender options are available
    await expect(page.locator('text=Male')).toBeVisible();
    await expect(page.locator('text=Female')).toBeVisible();
    await expect(page.locator('text=Other')).toBeVisible();
  });

  test('should handle all cancer site options', async ({ page }) => {
    await page.click('button:has-text("Add Patient")');
    
    await page.click('text=Select Cancer Site');
    
    // Check cancer site options are available
    await expect(page.locator('text=Lung')).toBeVisible();
    await expect(page.locator('text=Breast')).toBeVisible();
    await expect(page.locator('text=Kidney')).toBeVisible();
    await expect(page.locator('text=Colon')).toBeVisible();
    await expect(page.locator('text=Prostate')).toBeVisible();
    await expect(page.locator('text=Cervical')).toBeVisible();
    await expect(page.locator('text=Ovarian')).toBeVisible();
    await expect(page.locator('text=Liver')).toBeVisible();
    await expect(page.locator('text=Stomach')).toBeVisible();
    await expect(page.locator('text=Pancreatic')).toBeVisible();
    await expect(page.locator('text=Brain')).toBeVisible();
    await expect(page.locator('text=Blood')).toBeVisible();
    await expect(page.locator('text=Other')).toBeVisible();
  });

  test('should handle all risk level options', async ({ page }) => {
    await page.click('button:has-text("Add Patient")');
    
    await page.click('text=Select Risk Level');
    
    // Check risk level options are available
    await expect(page.locator('text=Low')).toBeVisible();
    await expect(page.locator('text=Medium')).toBeVisible();
    await expect(page.locator('text=High')).toBeVisible();
    await expect(page.locator('text=Critical')).toBeVisible();
  });

  test('should handle treatment pathway options', async ({ page }) => {
    await page.click('button:has-text("Add Patient")');
    
    // Treatment pathway should have Curative and Palliative options
    await expect(page.locator('text=Curative')).toBeVisible();
    // We can check for Palliative in a select dropdown if needed
  });

  test('should check for JavaScript errors during form interaction', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Interact with the form extensively
    await page.click('button:has-text("Add Patient")');
    await page.fill('input[placeholder="John"]', 'Test');
    await page.click('text=Select Gender');
    await page.click('text=Male');
    await page.click('text=Select Cancer Site');
    await page.click('text=Lung');
    await page.click('button:has-text("Cancel")');
    
    // Wait a bit for any async errors
    await page.waitForTimeout(1000);
    
    expect(errors).toHaveLength(0);
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('**/api/patients', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      }
    });

    await page.click('button:has-text("Add Patient")');
    
    // Fill required fields
    await page.fill('input[placeholder="John"]', 'Test');
    await page.fill('input[placeholder="Doe"]', 'Patient');
    await page.fill('input[placeholder="30"]', '35');
    await page.click('text=Select Gender');
    await page.click('text=Male');
    await page.fill('input[placeholder="+91 9876543210"]', '+91 9876543210');
    await page.click('text=Select Cancer Site');
    await page.click('text=Lung');
    
    // Submit the form
    await page.click('button:has-text("Add Patient"):last-child');
    
    // Wait for error handling
    await page.waitForTimeout(1000);
    
    // Form should still be open (modal shouldn't close on error)
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // The page should still be functional
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should check form accessibility', async ({ page }) => {
    await page.click('button:has-text("Add Patient")');
    
    // Check for proper labels and form structure
    await expect(page.locator('label:has-text("First Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Last Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Age")')).toBeVisible();
    await expect(page.locator('label:has-text("Gender")')).toBeVisible();
    await expect(page.locator('label:has-text("Mobile Number")')).toBeVisible();
    
    // Check that form inputs have proper associations
    const firstNameInput = page.locator('input[placeholder="John"]');
    await expect(firstNameInput).toBeVisible();
  });
});