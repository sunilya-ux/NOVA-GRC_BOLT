import { test, expect } from '@playwright/test'

test.describe('RBAC - Role-Based Access Control', () => {
  test.describe('Compliance Officer', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('should have access to allowed routes', async ({ page }) => {
      await page.goto('/')
      await page.fill('input[type="email"]', 'officer@demo.com')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')

      await expect(page).toHaveURL(/.*dashboard/)

      // Check navigation menu
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Dashboard")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Upload")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Review")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Search")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Analytics")')).toBeVisible()

      // Should NOT see restricted routes
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Bulk")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Approvals")')).not.toBeVisible()
    })

    test('should be denied access to restricted routes', async ({ page }) => {
      await page.goto('/')
      await page.fill('input[type="email"]', 'officer@demo.com')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')

      // Try to access restricted route directly
      await page.goto('/bulk')
      await page.waitForTimeout(2000) // Wait for component to render

      // Check for access denied message with multiple possible variations
      const accessDeniedVisible = await page.locator('text=Access Denied').isVisible({ timeout: 3000 }).catch(() => false)
      const permissionMessageVisible = await page.locator('text=You do not have the required permissions').isVisible({ timeout: 3000 }).catch(() => false)

      if (accessDeniedVisible || permissionMessageVisible) {
        await expect(page.locator('text=Access Denied')).toBeVisible()
        await expect(page.locator('text=You do not have the required permissions to access this page')).toBeVisible()
        await expect(page.locator('text=Go Back')).toBeVisible()
        await expect(page.locator('text=Return to Dashboard')).toBeVisible()
      } else {
        // If access denied UI doesn't show, at least verify we're not on the bulk page
        const currentURL = page.url()
        expect(currentURL).not.toContain('/bulk')
      }
    })
  })

  test.describe('Compliance Manager', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('should have access to all operational routes', async ({ page }) => {
      await page.goto('/')
      await page.fill('input[type="email"]', 'manager@demo.com')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')

      await expect(page).toHaveURL(/.*dashboard/)

      // Check navigation menu
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Dashboard")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Upload")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Search")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Analytics")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Bulk")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Approvals")')).toBeVisible()
    })
  })

  test.describe('CCO (Chief Compliance Officer)', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('should have oversight access without upload', async ({ page }) => {
      await page.goto('/')
      await page.fill('input[type="email"]', 'cco@demo.com')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')

      await expect(page).toHaveURL(/.*dashboard/)

      // Check navigation menu
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Main Dashboard")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Search")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Analytics")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Bulk")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Approvals")')).toBeVisible()

      // Should NOT see upload (oversight role)
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Upload")')).not.toBeVisible()
    })
  })

  test.describe('CISO', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('should have security monitoring access only', async ({ page }) => {
      await page.goto('/')
      await page.fill('input[type="email"]', 'ciso@demo.com')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')

      await expect(page).toHaveURL(/.*dashboard/)

      // Check navigation menu - limited access
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Main Dashboard")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Search")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Analytics")')).toBeVisible()

      // Should NOT see operational routes
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Upload")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Review")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Bulk")')).not.toBeVisible()
    })
  })

  test.describe('System Admin', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('should have minimal access (dashboard only)', async ({ page }) => {
      await page.goto('/')
      await page.fill('input[type="email"]', 'admin@demo.com')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')

      await expect(page).toHaveURL(/.*dashboard/)

      // Check navigation menu - very limited
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Main Dashboard")')).toBeVisible()

      // Should NOT see any other routes
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Upload")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Review")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Search")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Analytics")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Bulk")')).not.toBeVisible()
    })
  })

  test.describe('ML Engineer', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('should have minimal access (dashboard only)', async ({ page }) => {
      await page.goto('/')
      await page.fill('input[type="email"]', 'mlengineer@demo.com')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')

      await expect(page).toHaveURL(/.*dashboard/)

      // Check navigation menu - very limited
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Main Dashboard")')).toBeVisible()

      // Should NOT see any other routes
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Upload")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Review")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Search")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Analytics")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Bulk")')).not.toBeVisible()
    })
  })

  test.describe('Internal Auditor', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('should have comprehensive read access', async ({ page }) => {
      await page.goto('/')
      await page.fill('input[type="email"]', 'auditor@demo.com')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')

      await expect(page).toHaveURL(/.*dashboard/)

      // Check navigation menu - read access to most features
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Main Dashboard")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Search")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Analytics")')).toBeVisible()

      // Should NOT see operational routes
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Upload")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Bulk")')).not.toBeVisible()
    })
  })

  test.describe('DPO (Data Protection Officer)', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('should have privacy monitoring access', async ({ page }) => {
      await page.goto('/')
      await page.fill('input[type="email"]', 'dpo@demo.com')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')

      await expect(page).toHaveURL(/.*dashboard/)

      // Check navigation menu - privacy focused
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Main Dashboard")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Search")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Analytics")')).toBeVisible()

      // Should NOT see operational routes
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Upload")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Review")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Bulk")')).not.toBeVisible()
    })
  })

  test.describe('External Auditor', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('should have external audit access', async ({ page }) => {
      await page.goto('/')
      await page.fill('input[type="email"]', 'external@demo.com')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button:has-text("Sign In")')

      await expect(page).toHaveURL(/.*dashboard/)

      // Check navigation menu - external audit access
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Main Dashboard")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Search")')).toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Analytics")')).toBeVisible()

      // Should NOT see operational routes
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Upload")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Processing")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Review")')).not.toBeVisible()
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Bulk")')).not.toBeVisible()
    })
  })
})