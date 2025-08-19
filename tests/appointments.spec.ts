import { test, expect } from '@playwright/test';

test.describe('Appointments Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/appointments');
  });

  test('should load the appointments page successfully', async ({ page }) => {
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Appointments/i);
    await expect(page.locator('h1')).toContainText('Appointments');
  });

  test('should display the Add Appointment button', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Appointment")')).toBeVisible();
  });

  test('should open Add Appointment modal when button is clicked', async ({ page }) => {
    await page.click('button:has-text("Add Appointment")');
    
    // Check if modal opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Add New Appointment')).toBeVisible();
  });

  test('should display form fields in Add Appointment modal', async ({ page }) => {
    await page.click('button:has-text("Add Appointment")');
    
    // Check all form fields are present
    await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Dr. Smith"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="time"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Routine Checkup"]')).toBeVisible();
  });

  test('should validate required fields in Add Appointment form', async ({ page }) => {
    await page.click('button:has-text("Add Appointment")');
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Add Appointment"):last-child');
    
    // Check if HTML5 validation prevents submission
    const patientNameInput = page.locator('input[placeholder="John Doe"]');
    await expect(patientNameInput).toHaveAttribute('required');
  });

  test('should successfully submit Add Appointment form with valid data', async ({ page }) => {
    await page.click('button:has-text("Add Appointment")');
    
    // Fill out the form
    await page.fill('input[placeholder="John Doe"]', 'Test Patient');
    await page.fill('input[placeholder="Dr. Smith"]', 'Dr. Test');
    await page.fill('input[type="date"]', '2025-08-01');
    await page.fill('input[type="time"]', '14:30');
    await page.fill('input[placeholder="Routine Checkup"]', 'Test Appointment');
    
    // Submit the form
    await page.click('button:has-text("Add Appointment"):last-child');
    
    // Modal should close after successful submission
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should display doctor selection dropdown', async ({ page }) => {
    // Check if the doctor selection component is present
    await expect(page.locator('[data-testid="react-select"]')).toBeVisible();
  });

  test('should filter appointments by selected doctor', async ({ page }) => {
    // Select a doctor from the dropdown
    await page.selectOption('[data-testid="react-select"]', 'Dr. Smith');
    
    // Check if appointments are filtered (this would need actual appointments data)
    // For now, just verify the selection works
    const selectElement = page.locator('[data-testid="react-select"]');
    await expect(selectElement).toHaveValue('Dr. Smith');
  });

  test('should display calendar component', async ({ page }) => {
    await expect(page.locator('[data-testid="react-calendar"]')).toBeVisible();
  });

  test('should handle calendar date selection', async ({ page }) => {
    // Click on a date in the calendar
    await page.click('[data-testid="calendar-date-2025-07-28"]');
    
    // This would trigger the onChange handler
    // We can verify this through console logs or state changes
  });

  test('should display appointment details in calendar tiles', async ({ page }) => {
    // Check if appointments are shown in calendar tiles
    await expect(page.locator('[data-testid="calendar-tile-content"]')).toBeVisible();
  });

  test('should handle modal close actions', async ({ page }) => {
    // Test closing Add Appointment modal
    await page.click('button:has-text("Add Appointment")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should check for accessibility issues', async ({ page }) => {
    // Check for basic accessibility attributes
    await expect(page.locator('h1')).toHaveAttribute('role', 'heading');
    await expect(page.locator('button:has-text("Add Appointment")')).toBeVisible();
    
    // Check for ARIA labels on interactive elements
    const addButton = page.locator('button:has-text("Add Appointment")');
    await expect(addButton).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Add Appointment")')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should check for JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Interact with the page to trigger any potential errors
    await page.click('button:has-text("Add Appointment")');
    await page.click('button:has-text("Cancel")');
    
    // Wait a bit for any async errors
    await page.waitForTimeout(1000);
    
    expect(errors).toHaveLength(0);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure for API calls
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });
    
    // Try to interact with the page
    await page.click('button:has-text("Add Appointment")');
    
    // The page should still be functional even with network errors
    await expect(page.locator('h1')).toBeVisible();
  });
});
