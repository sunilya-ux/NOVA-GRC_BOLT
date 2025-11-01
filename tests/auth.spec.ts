import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/NOVA-GRC/)
    await expect(page.locator('h2:has-text("Welcome to NOVA-GRC")')).toBeVisible()
  })

  test('should show login form', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible()
  })

  test('should login with compliance officer credentials', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  test('should login with compliance manager credentials', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'manager@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  test('should login with CCO credentials', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'cco@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await expect(page).toHaveURL(/.*dashboard/)

    // Logout
    await page.click('button:has-text("Sign Out")')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h2:has-text("Welcome to NOVA-GRC")')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'invalid@demo.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("Sign In")')

    // Should stay on login page or show error
    await expect(page).toHaveURL('/login')
  })
})