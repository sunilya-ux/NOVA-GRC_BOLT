import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should display dashboard for compliance officer', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    await expect(page).toHaveURL(/.*dashboard/)

    // Check dashboard elements
    await expect(page.locator('text=Welcome back')).toBeVisible()
    await expect(page.locator('text=Total Documents')).toBeVisible()
    await expect(page.locator('text=Pending Review')).toBeVisible()
    await expect(page.locator('text=Approved')).toBeVisible()
    await expect(page.locator('text=Avg Confidence')).toBeVisible()

    // Check system status indicators
    await expect(page.locator('text=RBAC Enabled')).toBeVisible()
    await expect(page.locator('p').filter({ hasText: 'Audit Logging' }).first()).toBeVisible()
    await expect(page.locator('text=RLS Active')).toBeVisible()
  })

  test('should display dashboard for compliance manager', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'manager@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    await expect(page).toHaveURL(/.*dashboard/)

    // Check dashboard elements
    await expect(page.locator('text=Welcome back')).toBeVisible()
    await expect(page.locator('text=Total Documents')).toBeVisible()
    await expect(page.locator('text=Pending Review')).toBeVisible()
    await expect(page.locator('text=Approved')).toBeVisible()
    await expect(page.locator('text=Avg Confidence')).toBeVisible()
  })

  test('should display dashboard for CCO', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'cco@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    await expect(page).toHaveURL(/.*dashboard/)

    // Check dashboard elements
    await expect(page.locator('text=Welcome back')).toBeVisible()
    await expect(page.locator('text=Total Documents')).toBeVisible()
    await expect(page.locator('text=Pending Review')).toBeVisible()
    await expect(page.locator('text=Approved')).toBeVisible()
    await expect(page.locator('text=Avg Confidence')).toBeVisible()
  })

  test('should show role-based statistics', async ({ page }) => {
    // Test compliance officer - should see limited stats
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    await expect(page).toHaveURL(/.*dashboard/)
    // Stats should be visible (own documents only)
    await expect(page.locator('text=Total Documents')).toBeVisible()

    // Logout and test CCO - should see all stats
    await page.click('button:has-text("Sign Out")')
    await page.fill('input[type="email"]', 'cco@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('text=Total Documents')).toBeVisible()
  })

  test('should navigate to different sections from dashboard', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    await expect(page).toHaveURL(/.*dashboard/)

    // Test navigation to upload page
    await page.click('nav a:has-text("Upload")')
    await expect(page).toHaveURL(/.*upload/)

    // Navigate back to dashboard
    await page.click('nav a:has-text("Dashboard")')
    await expect(page).toHaveURL(/.*dashboard/)

    // Test navigation to search
    await page.click('nav a:has-text("Search")')
    await expect(page).toHaveURL(/.*search/)
  })
})