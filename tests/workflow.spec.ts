import { test, expect } from '@playwright/test'

test.describe('Document Workflow', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should complete full document processing workflow', async ({ page }) => {
    // Login as compliance officer
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')
    await expect(page).toHaveURL(/.*dashboard/)

    // Navigate to upload page
    await page.click('nav.hidden.md\\:flex a:has-text\("Upload")')
    await expect(page).toHaveURL(/.*upload/)

    // Check upload page elements
    await expect(page.locator('text=Document Upload')).toBeVisible()
    await expect(page.locator('input[type="file"]')).toBeAttached()

    // Navigate to processing page
    await page.click('nav.hidden.md\\:flex a:has-text\("Processing")')
    await expect(page).toHaveURL(/.*processing/)

    // Check processing page elements
    await expect(page.locator('text=AI Document Processing')).toBeVisible()
    await expect(page.locator('button:has-text("Process with AI")').first()).toBeVisible()

    // Navigate to review page
    await page.click('nav.hidden.md\\:flex a:has-text\("Review")')
    await expect(page).toHaveURL(/.*review/)

    // Check review page elements
    await expect(page.locator('text=Document Approvals')).toBeVisible()

    // Navigate to search page
    await page.click('nav.hidden.md\\:flex a:has-text\("Search")')
    await expect(page).toHaveURL(/.*search/)

    // Check search page elements
    await expect(page.locator('text=Document Search')).toBeVisible()
    await expect(page.locator('input[placeholder*="Search for documents"]')).toBeVisible()
  })

  test('should test document upload functionality', async ({ page }) => {
    // Login as compliance officer
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    // Navigate to upload
    await page.click('nav.hidden.md\\:flex a:has-text\("Upload")')
    await expect(page.locator('text=Document Upload')).toBeVisible()

    // Check file input exists (it's hidden but should be present)
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeAttached()

    // Check upload button exists
    await expect(page.locator('button:has-text("Upload & Process")')).toBeVisible()
  })

  test('should test document processing functionality', async ({ page }) => {
    // Login as compliance officer
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    // Navigate to processing
    await page.click('nav.hidden.md\\:flex a:has-text\("Processing")')
    await expect(page.locator('text=AI Document Processing')).toBeVisible()

    // Check table headers
    await expect(page.locator('text=Preview')).toBeVisible()
    await expect(page.locator('text=Document Type')).toBeVisible()
    await expect(page.locator('text=Status')).toBeVisible()
    await expect(page.locator('text=Actions')).toBeVisible()
  })

  test('should test document review functionality', async ({ page }) => {
    // Login as compliance officer
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    // Navigate to review
    await page.click('nav.hidden.md\\:flex a:has-text\("Review")')
    await expect(page.locator('text=Document Approvals')).toBeVisible()

    // Check review interface elements
    await expect(page.locator('text=Select a document to review')).toBeVisible()
  })

  test('should test document search functionality', async ({ page }) => {
    // Login as compliance officer
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    // Navigate to search
    await page.click('nav.hidden.md\\:flex a:has-text\("Search")')
    await expect(page.locator('text=Document Search')).toBeVisible()

    // Check search elements
    await expect(page.locator('input[placeholder*="Search for documents"]')).toBeVisible()
    await expect(page.locator('select')).toHaveCount(3) // Search type, document type, status

    // Test search button
    await expect(page.locator('button:has-text("Search")')).toBeVisible()
  })

  test('should test analytics dashboard', async ({ page }) => {
    // Login as compliance officer
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    // Navigate to analytics
    await page.click('nav.hidden.md\\:flex a:has-text\("Analytics")')
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible()

    // Check analytics elements
    await expect(page.locator('text=Total Documents')).toBeVisible()
    await expect(page.locator('text=AI Accuracy')).toBeVisible()
    await expect(page.locator('text=Approved')).toBeVisible()
    await expect(page.locator('text=Rejected')).toBeVisible()

    // Check time range selectors
    await expect(page.locator('button:has-text("Last 7 days")')).toBeVisible()
    await expect(page.locator('button:has-text("Last 30 days")')).toBeVisible()
    await expect(page.locator('button:has-text("Last 90 days")')).toBeVisible()
  })

  test('should test bulk processing functionality', async ({ page }) => {
    // Login as compliance manager (only role with bulk access)
    await page.goto('/')
    await page.fill('input[type="email"]', 'manager@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    // Navigate to bulk processing
    await page.click('nav.hidden.md\\:flex a:has-text\("Bulk")')
    await expect(page.locator('text=Bulk Document Processing')).toBeVisible()

    // Check bulk processing elements
    await expect(page.locator('text=Select documents for bulk processing')).toBeVisible()
    await expect(page.locator('text=Bulk Document Processing')).toBeVisible()
  })

  test('should test maker-checker workflow', async ({ page }) => {
    // This would require actual documents in the system
    // For now, just test the UI is present

    // Login as compliance officer
    await page.goto('/')
    await page.fill('input[type="email"]', 'officer@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button:has-text("Sign In")')

    // Navigate to review
    await page.click('nav.hidden.md\\:flex a:has-text\("Review")')
    await expect(page.locator('text=Document Approvals')).toBeVisible()

    // Check for maker-checker elements - these are only visible when a document is selected
    // Since there might not be documents, we'll check the general UI structure
    await expect(page.locator('text=Select a document to review')).toBeVisible()
  })
})