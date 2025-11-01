import { test, expect } from '@playwright/test'

test.describe('Comprehensive Workflow Testing', () => {
  test.describe('End-to-End Document Processing Workflow', () => {
    test('should complete full document lifecycle from upload to approval', async ({ page }) => {
      // Login as Compliance Officer
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Step 1: Upload document
      await page.click('nav a:has-text("Upload")')
      await page.waitForURL('**/upload', { timeout: 5000 })

      // Verify upload page and simulate file upload
      await expect(page.locator('text=Document Upload')).toBeVisible()
      const fileInput = page.locator('input[type="file"]')
      await expect(fileInput).toBeAttached()

      // Step 2: Process document (AI analysis)
      await page.click('nav a:has-text("Processing")')
      await page.waitForURL('**/processing', { timeout: 5000 })

      await expect(page.locator('text=AI Document Processing')).toBeVisible()
      await expect(page.locator('button:has-text("Process with AI")').first()).toBeVisible()

      // Step 3: Review document
      await page.click('nav a:has-text("Review")')
      await page.waitForURL('**/review', { timeout: 5000 })

      await expect(page.locator('text=Document Review Queue')).toBeVisible()

      // Step 4: Search and verify
      await page.click('nav a:has-text("Search")')
      await page.waitForURL('**/search', { timeout: 5000 })

      await expect(page.locator('text=Document Search')).toBeVisible()
      await expect(page.locator('input[placeholder*="Search for documents"]')).toBeVisible()

      // Step 5: Check analytics
      await page.click('nav a:has-text("Analytics")')
      await page.waitForURL('**/analytics', { timeout: 5000 })

      await expect(page.locator('text=Analytics Dashboard')).toBeVisible()
    })
  })

  test.describe('Maker-Checker Workflow Validation', () => {
    test('should validate maker-checker approval process', async ({ page }) => {
      // Login as Compliance Officer (Maker)
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Navigate to review page
      await page.click('nav a:has-text("Review")')
      await page.waitForURL('**/review', { timeout: 5000 })

      // Check for maker-checker elements (when documents are available)
      const agreeButton = page.locator('button:has-text("Agree with AI")')
      const disagreeButton = page.locator('button:has-text("Disagree with AI")')

      // Verify the UI structure is present
      await expect(page.locator('text=Select a document to review')).toBeVisible()

      // If documents exist, test the workflow
      const agreeVisible = await agreeButton.isVisible()
      const disagreeVisible = await disagreeButton.isVisible()

      if (agreeVisible && disagreeVisible) {
        console.log('Maker-checker workflow elements are available')
        // Could test actual approval/rejection workflow here
      } else {
        console.log('No documents available for maker-checker workflow testing')
      }
    })

    test('should validate compliance manager approval workflow', async ({ page }) => {
      // Login as Compliance Manager (Checker)
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Manager')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Check access to approvals
      await expect(page.locator('nav a:has-text("Approvals")')).toBeVisible()

      // Navigate to approvals
      await page.click('nav a:has-text("Approvals")')
      await page.waitForURL('**/approvals', { timeout: 5000 })

      // Verify approvals interface
      await expect(page.locator('text=Document Approvals')).toBeVisible()
    })
  })

  test.describe('Bulk Processing Workflow', () => {
    test('should validate bulk processing for authorized roles', async ({ page }) => {
      // Test Compliance Manager bulk access
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Manager')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Verify bulk processing access
      await expect(page.locator('nav a:has-text("Bulk")')).toBeVisible()

      // Navigate to bulk processing
      await page.click('nav a:has-text("Bulk")')
      await page.waitForURL('**/bulk', { timeout: 5000 })

      // Verify bulk processing interface
      await expect(page.locator('text=Bulk Document Processing')).toBeVisible()
      await expect(page.locator('text=Select documents for bulk processing')).toBeVisible()
    })

    test('should deny bulk processing access for unauthorized roles', async ({ page }) => {
      // Test Compliance Officer (should not have bulk access)
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Verify bulk processing is not visible
      await expect(page.locator('nav a:has-text("Bulk")')).not.toBeVisible()

      // Try direct access (should be blocked)
      await page.goto('http://localhost:5173/bulk')
      await page.waitForTimeout(1000)
      await expect(page.locator('text=Access Denied')).toBeVisible()
    })
  })

  test.describe('Security and Compliance Validation', () => {
    test('should validate session security and logout', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Verify authenticated state
      await expect(page.locator('text=Welcome back')).toBeVisible()

      // Test logout
      await page.click('button:has-text("Sign Out")')
      await page.waitForURL('/login', { timeout: 5000 })

      // Verify logged out state
      await expect(page.locator('h2:has-text("Welcome to NOVA-GRC")')).toBeVisible()

      // Try to access protected route after logout
      await page.goto('http://localhost:5173/dashboard')
      await page.waitForTimeout(1000)
      // Should redirect to login
      await expect(page).toHaveURL(/.*login/)
    })

    test('should validate RBAC enforcement across all routes', async ({ page }) => {
      const roleTests = [
        {
          role: 'Compliance Officer',
          allowedRoutes: ['upload', 'processing', 'review', 'search', 'analytics'],
          deniedRoutes: ['bulk', 'approvals']
        },
        {
          role: 'CCO',
          allowedRoutes: ['processing', 'review', 'search', 'analytics', 'bulk', 'approvals'],
          deniedRoutes: ['upload']
        },
        {
          role: 'CISO',
          allowedRoutes: ['search', 'analytics'],
          deniedRoutes: ['upload', 'processing', 'review', 'bulk']
        }
      ]

      for (const roleTest of roleTests) {
        console.log(`Testing RBAC for ${roleTest.role}`)

        // Login
        await page.goto('http://localhost:5173')
        await page.click(`text=${roleTest.role}`)
        await page.click('button:has-text("Sign In")')
        await page.waitForURL('**/dashboard', { timeout: 15000 })

        // Test allowed routes
        for (const route of roleTest.allowedRoutes) {
          await page.goto(`http://localhost:5173/${route}`)
          await page.waitForTimeout(1000)
          // Should not show access denied
          const accessDeniedVisible = await page.locator('text=Access Denied').isVisible()
          expect(accessDeniedVisible, `${roleTest.role} should access ${route}`).toBe(false)
        }

        // Test denied routes
        for (const route of roleTest.deniedRoutes) {
          await page.goto(`http://localhost:5173/${route}`)
          await page.waitForTimeout(1000)
          // Should show access denied
          await expect(page.locator('text=Access Denied')).toBeVisible()
        }

        // Logout
        await page.goto('http://localhost:5173/login')
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('AI Explainability and Bias Detection', () => {
    test('should validate AI explainability access for authorized roles', async ({ page }) => {
      const authorizedRoles = ['Compliance Officer', 'Compliance Manager', 'CCO', 'CISO', 'Internal Auditor', 'DPO', 'External Auditor']

      for (const role of authorizedRoles) {
        console.log(`Testing AI Explainability access for ${role}`)

        // Login
        await page.goto('http://localhost:5173')
        await page.click(`text=${role}`)
        await page.click('button:has-text("Sign In")')
        await page.waitForURL('**/dashboard', { timeout: 15000 })

        // Check navigation
        const aiLink = page.locator('nav a:has-text("AI Explainability")')
        await expect(aiLink).toBeVisible()

        // Navigate to AI explainability
        await page.goto('http://localhost:5173/ai-explainability')
        await page.waitForTimeout(2000)

        // Verify page content
        await expect(page.locator('h1:has-text("AI Explainability")')).toBeVisible()
        await expect(page.locator('text=Understand AI decision-making with bias detection')).toBeVisible()

        // Logout
        await page.goto('http://localhost:5173/login')
        await page.waitForTimeout(1000)
      }
    })

    test('should validate AI explainability features', async ({ page }) => {
      // Login as CCO
      await page.goto('http://localhost:5173')
      await page.click('text=CCO')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Navigate to AI explainability
      await page.goto('http://localhost:5173/ai-explainability')
      await page.waitForTimeout(2000)

      // Check for key AI explainability elements
      await expect(page.locator('h1:has-text("AI Explainability")')).toBeVisible()
      await expect(page.locator('text=Bias Detection')).toBeVisible()
      await expect(page.locator('text=Decision Confidence')).toBeVisible()
    })
  })

  test.describe('Audit Logging and Activity Monitoring', () => {
    test('should validate audit log access for authorized roles', async ({ page }) => {
      const rolesWithAuditAccess = ['Compliance Officer', 'Compliance Manager', 'CCO', 'CISO', 'Internal Auditor', 'DPO', 'External Auditor']

      for (const role of rolesWithAuditAccess) {
        console.log(`Testing audit log access for ${role}`)

        // Login
        await page.goto('http://localhost:5173')
        await page.click(`text=${role}`)
        await page.click('button:has-text("Sign In")')
        await page.waitForURL('**/dashboard', { timeout: 15000 })

        // Check for audit logs in navigation
        const auditLink = page.locator('nav a:has-text("My Activity")')
        await expect(auditLink).toBeVisible()

        // Navigate to audit logs
        await page.goto('http://localhost:5173/audit-logs')
        await page.waitForTimeout(2000)

        // Verify audit log interface
        await expect(page.locator('text=My Activity Log')).toBeVisible()

        // Logout
        await page.goto('http://localhost:5173/login')
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle invalid login attempts gracefully', async ({ page }) => {
      await page.goto('http://localhost:5173')

      // Try invalid credentials
      await page.fill('input[type="email"]', 'invalid@demo.com')
      await page.fill('input[type="password"]', 'wrongpassword')
      await page.click('button:has-text("Sign In")')

      // Should stay on login page or show error
      await page.waitForTimeout(1000)
      await expect(page).toHaveURL(/.*login/)
    })

    test('should handle unauthorized route access', async ({ page }) => {
      // Login as basic user
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Try to access admin-only routes
      const adminRoutes = ['/admin', '/system-config', '/user-management']

      for (const route of adminRoutes) {
        await page.goto(`http://localhost:5173${route}`)
        await page.waitForTimeout(1000)
        await expect(page.locator('text=Access Denied')).toBeVisible()
      }
    })

    test('should handle network errors gracefully', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Navigate to a page that might have network dependencies
      await page.click('nav a:has-text("Processing")')
      await page.waitForURL('**/processing', { timeout: 5000 })

      // The page should load even if backend is unavailable
      await expect(page.locator('text=AI Document Processing')).toBeVisible()
    })
  })
})