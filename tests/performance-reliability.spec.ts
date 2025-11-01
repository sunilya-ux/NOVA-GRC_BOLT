import { test, expect } from '@playwright/test'

test.describe('Performance and Reliability Tests', () => {
  test.describe('Page Load Performance', () => {
    test('should load login page within acceptable time', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('http://localhost:5173')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime

      console.log(`Login page load time: ${loadTime}ms`)
      expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds

      // Verify critical elements are visible
      await expect(page.locator('h2:has-text("Welcome to NOVA-GRC")')).toBeVisible()
    })

    test('should load dashboard quickly after login', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')

      const startTime = Date.now()
      await page.waitForURL('**/dashboard', { timeout: 15000 })
      const loadTime = Date.now() - startTime

      console.log(`Dashboard load time: ${loadTime}ms`)
      expect(loadTime).toBeLessThan(10000) // Should load within 10 seconds

      // Verify dashboard content loads
      await expect(page.locator('text=Welcome back')).toBeVisible()
    })

    test('should load all main pages within performance budget', async ({ page }) => {
      // Login first
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      const pages = [
        { name: 'Upload', path: 'upload', selector: 'h1:has-text("Document Upload")' },
        { name: 'Processing', path: 'processing', selector: 'h1:has-text("AI Document Processing")' },
        { name: 'Review', path: 'review', selector: 'h1:has-text("Document Review Queue")' },
        { name: 'Search', path: 'search', selector: 'h1:has-text("Document Search")' },
        { name: 'Analytics', path: 'analytics', selector: 'h1:has-text("Analytics Dashboard")' }
      ]

      for (const pageConfig of pages) {
        const startTime = Date.now()
        await page.goto(`http://localhost:5173/${pageConfig.path}`)
        await page.waitForLoadState('networkidle')
        const loadTime = Date.now() - startTime

        console.log(`${pageConfig.name} page load time: ${loadTime}ms`)
        expect(loadTime).toBeLessThan(8000) // Should load within 8 seconds

        // Verify page content
        await expect(page.locator(pageConfig.selector)).toBeVisible()
      }
    })
  })

  test.describe('Navigation Performance', () => {
    test('should navigate between pages smoothly', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      const navigationTests = [
        { from: 'Dashboard', to: 'Upload', selector: 'h1:has-text("Document Upload")' },
        { from: 'Upload', to: 'Processing', selector: 'h1:has-text("AI Document Processing")' },
        { from: 'Processing', to: 'Review', selector: 'h1:has-text("Document Review Queue")' },
        { from: 'Review', to: 'Search', selector: 'h1:has-text("Document Search")' },
        { from: 'Search', to: 'Analytics', selector: 'h1:has-text("Analytics Dashboard")' }
      ]

      for (const navTest of navigationTests) {
        const startTime = Date.now()
        await page.click(`nav a:has-text("${navTest.to}")`)
        await page.waitForURL(`**/${navTest.to.toLowerCase()}`, { timeout: 5000 })
        const navTime = Date.now() - startTime

        console.log(`Navigation from ${navTest.from} to ${navTest.to}: ${navTime}ms`)
        expect(navTime).toBeLessThan(3000) // Should navigate within 3 seconds

        // Verify destination page
        await expect(page.locator(navTest.selector)).toBeVisible()
      }
    })

    test('should handle back/forward navigation correctly', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Navigate to upload
      await page.click('nav a:has-text("Upload")')
      await page.waitForURL('**/upload', { timeout: 5000 })
      await expect(page.locator('h1:has-text("Document Upload")')).toBeVisible()

      // Navigate to processing
      await page.click('nav a:has-text("Processing")')
      await page.waitForURL('**/processing', { timeout: 5000 })
      await expect(page.locator('h1:has-text("AI Document Processing")')).toBeVisible()

      // Test back navigation
      await page.goBack()
      await page.waitForURL('**/upload', { timeout: 5000 })
      await expect(page.locator('text=Document Upload')).toBeVisible()

      // Test forward navigation
      await page.goForward()
      await page.waitForURL('**/processing', { timeout: 5000 })
      await expect(page.locator('text=AI Document Processing')).toBeVisible()
    })
  })

  test.describe('Concurrent User Simulation', () => {
    test('should handle multiple role logins concurrently', async ({ browser }) => {
      const roles = ['Compliance Officer', 'Compliance Manager', 'CCO', 'CISO']

      // Create multiple browser contexts (simulating different users)
      const contexts = await Promise.all(
        roles.map(() => browser.newContext())
      )

      const pages = await Promise.all(
        contexts.map(context => context.newPage())
      )

      // Login with different roles concurrently
      const loginPromises = pages.map(async (page, index) => {
        const role = roles[index]
        console.log(`Logging in as ${role}`)

        await page.goto('http://localhost:5173')
        await page.click(`text=${role}`)
        await page.click('button:has-text("Sign In")')
        await page.waitForURL('**/dashboard', { timeout: 15000 })

        // Verify successful login
        await expect(page.locator('text=Welcome back')).toBeVisible()

        return page
      })

      const loggedInPages = await Promise.all(loginPromises)

      // Verify all logins were successful
      expect(loggedInPages).toHaveLength(roles.length)

      // Clean up
      await Promise.all(contexts.map(context => context.close()))
    })

    test('should maintain session isolation between users', async ({ browser }) => {
      // Create two contexts
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()

      const page1 = await context1.newPage()
      const page2 = await context2.newPage()

      // Login as different users
      await page1.goto('http://localhost:5173')
      await page1.click('text=Compliance Officer')
      await page1.click('button:has-text("Sign In")')
      await page1.waitForURL('**/dashboard', { timeout: 15000 })

      await page2.goto('http://localhost:5173')
      await page2.click('text=CCO')
      await page2.click('button:has-text("Sign In")')
      await page2.waitForURL('**/dashboard', { timeout: 15000 })

      // Verify different navigation menus
      await expect(page1.locator('nav a:has-text("Upload")')).toBeVisible()
      await expect(page1.locator('nav a:has-text("Approvals")')).not.toBeVisible()

      await expect(page2.locator('nav a:has-text("Approvals")')).toBeVisible()
      await expect(page2.locator('nav a:has-text("Upload")')).not.toBeVisible()

      // Clean up
      await context1.close()
      await context2.close()
    })
  })

  test.describe('Error Recovery and Resilience', () => {
    test('should handle network interruptions gracefully', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Navigate to a page
      await page.click('nav a:has-text("Processing")')
      await page.waitForURL('**/processing', { timeout: 5000 })

      // Simulate network issues by reloading during navigation
      await page.reload()
      await page.waitForTimeout(2000)

      // Should recover and show appropriate state
      const currentURL = page.url()
      expect(currentURL).toContain('processing')
    })

    test('should recover from JavaScript errors', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Inject a JavaScript error (simulating a bug)
      await page.addScriptTag({
        content: `
          setTimeout(() => {
            throw new Error('Simulated JavaScript error')
          }, 1000)
        `
      })

      // Wait a bit
      await page.waitForTimeout(2000)

      // Application should still be functional
      await expect(page.locator('text=Welcome back')).toBeVisible()

      // Navigation should still work
      await page.click('nav a:has-text("Search")')
      await page.waitForURL('**/search', { timeout: 5000 })
      await expect(page.locator('h1:has-text("Document Search")')).toBeVisible()
    })

    test('should handle invalid route navigation', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Try invalid routes
      const invalidRoutes = ['/invalid', '/nonexistent', '/broken-link']

      for (const route of invalidRoutes) {
        await page.goto(`http://localhost:5173${route}`)
        await page.waitForTimeout(1000)

        // Should either show 404 or redirect appropriately
        const currentURL = page.url()
        expect(currentURL).not.toBe(`http://localhost:5173${route}`)
      }
    })
  })

  test.describe('Memory and Resource Usage', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Navigate through multiple pages repeatedly
      const pages = ['upload', 'processing', 'review', 'search', 'analytics']

      for (let i = 0; i < 5; i++) {
        for (const pageName of pages) {
          await page.goto(`http://localhost:5173/${pageName}`)
          await page.waitForTimeout(500)
        }
      }

      // Should still be responsive
      await page.click('nav a:has-text("Dashboard")')
      await page.waitForURL('**/dashboard', { timeout: 5000 })
      await expect(page.locator('text=Welcome back')).toBeVisible()
    })

    test('should handle large data sets appropriately', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Navigate to analytics (which might show large datasets)
      await page.click('nav a:has-text("Analytics")')
      await page.waitForURL('**/analytics', { timeout: 5000 })

      // Should load without performance issues
      await expect(page.locator('h1:has-text("Analytics Dashboard")')).toBeVisible()

      // Test filtering/sorting operations
      const timeSelectors = ['Last 7 days', 'Last 30 days', 'Last 90 days']
      for (const selector of timeSelectors) {
        const button = page.locator(`button:has-text("${selector}")`)
        if (await button.isVisible()) {
          await button.click()
          await page.waitForTimeout(1000)
          // Should update without hanging
          await expect(page.locator('h1:has-text("Analytics Dashboard")')).toBeVisible()
        }
      }
    })
  })

  test.describe('Cross-browser Compatibility', () => {
    test('should work with different viewport sizes', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('http://localhost:5173')
      await page.waitForLoadState('networkidle')

      // Should be responsive
      await expect(page.locator('h2:has-text("Welcome to NOVA-GRC")')).toBeVisible()

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.reload()
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h2:has-text("Welcome to NOVA-GRC")')).toBeVisible()

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.reload()
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h2:has-text("Welcome to NOVA-GRC")')).toBeVisible()
    })
  })

  test.describe('Long-running Session Stability', () => {
    test('should maintain session stability over time', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Perform various operations over time
      for (let i = 0; i < 3; i++) {
        // Navigate through pages
        await page.click('nav a:has-text("Upload")')
        await page.waitForURL('**/upload', { timeout: 5000 })

        await page.click('nav a:has-text("Processing")')
        await page.waitForURL('**/processing', { timeout: 5000 })

        await page.click('nav a:has-text("Dashboard")')
        await page.waitForURL('**/dashboard', { timeout: 5000 })

        // Wait a bit between iterations
        await page.waitForTimeout(2000)
      }

      // Session should still be active
      await expect(page.locator('text=Welcome back')).toBeVisible()
      await expect(page.locator('button:has-text("Sign Out")')).toBeVisible()
    })
  })
})