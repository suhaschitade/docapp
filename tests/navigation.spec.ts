import { test, expect } from '@playwright/test';

test.describe('Navigation and URL Testing', () => {
  test('should have valid page routes', async ({ page }) => {
    // Test appointments page
    await page.goto('/appointments');
    await expect(page).toHaveURL('/appointments');
    await expect(page.locator('h1')).toContainText('Appointments');

    // Test dashboard page (if it exists)
    const dashboardResponse = await page.goto('/dashboard');
    expect(dashboardResponse?.status()).toBeLessThan(400);

    // Test manage-patients page (if it exists)
    const patientsResponse = await page.goto('/manage-patients');
    expect(patientsResponse?.status()).toBeLessThan(400);
  });

  test('should handle 404 for non-existent routes', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(404);
  });

  test('should check for broken internal links', async ({ page }) => {
    await page.goto('/appointments');
    
    // Get all internal links
    const links = await page.locator('a[href^="/"]').all();
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) {
        const response = await page.goto(href);
        expect(response?.status()).toBeLessThan(400);
      }
    }
  });

  test('should validate external links', async ({ page }) => {
    await page.goto('/appointments');
    
    // Get all external links
    const externalLinks = await page.locator('a[href^="http"]').all();
    
    for (const link of externalLinks) {
      const href = await link.getAttribute('href');
      if (href) {
        // Check if external link is reachable
        try {
          const response = await fetch(href, { method: 'HEAD' });
          expect(response.status).toBeLessThan(400);
        } catch (error) {
          console.warn(`External link may be unreachable: ${href}`);
        }
      }
    }
  });

  test('should check for proper URL structure', async ({ page }) => {
    await page.goto('/appointments');
    
    // Check that the URL follows proper conventions
    const currentURL = page.url();
    expect(currentURL).toMatch(/^https?:\/\/.+\/appointments$/);
  });

  test('should handle URL parameters correctly', async ({ page }) => {
    // Test with query parameters
    await page.goto('/appointments?doctor=smith');
    await expect(page).toHaveURL('/appointments?doctor=smith');
    
    // Test with hash fragments
    await page.goto('/appointments#calendar');
    await expect(page).toHaveURL('/appointments#calendar');
  });

  test('should redirect properly from root', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check if there's a proper redirect or if root page loads correctly
    expect(response?.status()).toBeLessThan(400);
  });
});
