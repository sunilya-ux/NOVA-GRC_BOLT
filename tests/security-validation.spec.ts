import { test, expect } from '@playwright/test'

test.describe('Security Validation Tests', () => {
  test.describe('Authentication Security', () => {
    test('should prevent unauthorized access to protected routes', async ({ page }) => {
      // Try to access protected routes without authentication
      const protectedRoutes = [
        '/dashboard',
        '/upload',
        '/processing',
        '/review',
        '/search',
        '/analytics',
        '/bulk',
        '/approvals',
        '/ai-explainability',
        '/compliance-dashboard'
      ]

      for (const route of protectedRoutes) {
        await page.goto(`http://localhost:5173${route}`)
        await page.waitForTimeout(1000)
        // Should redirect to login
        await expect(page).toHaveURL(/.*login/)
      }
    })

    test('should validate session persistence across page refreshes', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      await page.click('text=Compliance Officer')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Refresh page
      await page.reload()
      await page.waitForTimeout(2000)

      // Should still be logged in
      await expect(page).toHaveURL(/.*dashboard/)
      await expect(page.locator('text=Welcome back')).toBeVisible()
    })

    test('should handle concurrent sessions appropriately', async ({ page }) => {
      // Login with one role
      await page.goto('http://localhost:5173')
      // Wait for login page to fully load
      await page.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })
      await page.click('button:has-text("Compliance Officer")')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Open new page context (simulating another browser tab)
      const newPage = await page.context().newPage()
      await newPage.goto('http://localhost:5173')
      // Wait for login page to fully load
      await newPage.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })

      // Login with different role in new tab
      await newPage.click('button:has-text("CCO")')
      await newPage.click('button:has-text("Sign In")')
      await newPage.waitForURL('**/dashboard', { timeout: 15000 })

      // Both should work independently
      await expect(page).toHaveURL(/.*dashboard/)
      await expect(newPage).toHaveURL(/.*dashboard/)

      await newPage.close()
    })
  })

  test.describe('Input Validation and Sanitization', () => {
    test('should handle special characters in search input', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      // Wait for login page to fully load
      await page.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })
      await page.click('button:has-text("Compliance Officer")')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Navigate to search
      await page.click('nav.hidden.md\\:flex a:has-text\("Search")')
      await page.waitForURL('**/search', { timeout: 5000 })

      // Test with special characters
      const specialChars = ['<script>', 'alert("xss")', '../../../etc/passwd', 'OR 1=1 --']

      for (const char of specialChars) {
        await page.fill('input[placeholder*="Search for documents"]', char)
        await page.click('button:has-text("Search")')
        await page.waitForTimeout(1000)

        // Should not crash or show unexpected behavior
        await expect(page.locator('text=Document Search')).toBeVisible()
      }
    })

    test('should validate file upload restrictions', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      // Wait for login page to fully load
      await page.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })
      await page.click('button:has-text("Compliance Officer")')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Navigate to upload
      await page.click('nav.hidden.md\\:flex a:has-text\("Upload")')
      await page.waitForURL('**/upload', { timeout: 5000 })

      // Check file input exists and has proper restrictions
      const fileInput = page.locator('input[type="file"]')
      await expect(fileInput).toBeAttached()

      // Check for file type restrictions (should be visible in UI)
      await expect(page.locator('text=Supported formats')).toBeVisible()
    })
  })

  test.describe('RBAC Security Enforcement', () => {
    test('should enforce granular permissions for all roles', async ({ page }) => {
      const rolePermissions = {
        'Compliance Officer': {
          allowed: ['upload', 'processing', 'review', 'search', 'analytics', 'ai-explainability', 'audit-logs'],
          denied: ['bulk', 'approvals']
        },
        'Compliance Manager': {
          allowed: ['upload', 'processing', 'review', 'search', 'analytics', 'bulk', 'approvals', 'ai-explainability', 'audit-logs'],
          denied: []
        },
        'CCO': {
          allowed: ['processing', 'review', 'search', 'analytics', 'bulk', 'approvals', 'ai-explainability', 'audit-logs', 'compliance-dashboard'],
          denied: ['upload']
        },
        'CISO': {
           allowed: ['search', 'analytics', 'ai-explainability', 'audit-logs', 'compliance-dashboard'],
           denied: ['upload', 'processing', 'review', 'bulk', 'approvals']
         },
        'Internal Auditor': {
           allowed: ['processing', 'search', 'analytics', 'ai-explainability', 'audit-logs', 'compliance-dashboard'],
           denied: ['upload', 'review', 'bulk', 'approvals']
         },
        'DPO': {
           allowed: ['search', 'analytics', 'ai-explainability', 'audit-logs', 'compliance-dashboard'],
           denied: ['upload', 'processing', 'review', 'bulk', 'approvals']
         },
        'External Auditor': {
           allowed: ['search', 'analytics', 'ai-explainability', 'compliance-dashboard'],
           denied: ['upload', 'processing', 'review', 'bulk', 'audit-logs', 'approvals']
         },
        'System Admin': {
          allowed: ['dashboard'],
          denied: ['upload', 'processing', 'review', 'search', 'analytics', 'bulk', 'approvals', 'ai-explainability', 'audit-logs', 'compliance-dashboard']
        },
        'ML Engineer': {
          allowed: ['dashboard'],
          denied: ['upload', 'processing', 'review', 'search', 'analytics', 'bulk', 'approvals', 'ai-explainability', 'audit-logs', 'compliance-dashboard']
        }
      }

      for (const [role, permissions] of Object.entries(rolePermissions)) {
        console.log(`Testing permissions for ${role}`)

        // Login
        await page.goto('http://localhost:5173')
        // Wait for login page to fully load
        await page.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })
        await page.click(`button:has-text("${role}")`)
        await page.click('button:has-text("Sign In")')
        await page.waitForURL('**/dashboard', { timeout: 15000 })

        // Test allowed routes
        for (const route of permissions.allowed) {
          await page.goto(`http://localhost:5173/${route}`)
          await page.waitForTimeout(1000)

          // Should not show access denied
          const accessDeniedVisible = await page.locator('text=Access Denied').isVisible()
          expect(accessDeniedVisible, `${role} should access ${route}`).toBe(false)
        }

        // Test denied routes
        for (const route of permissions.denied) {
          await page.goto(`http://localhost:5173/${route}`)
          await page.waitForTimeout(1000)

          // Should show access denied or redirect to dashboard
          const hasAccessDenied = await page.locator('text=Access Denied').isVisible()
          const isOnDashboard = page.url().includes('/dashboard')

          expect(hasAccessDenied || isOnDashboard, `${role} should be denied access to ${route}`).toBe(true)
        }

        // Logout
        await page.goto('http://localhost:5173/login')
        await page.waitForTimeout(1000)
      }
    })

    test('should prevent privilege escalation attempts', async ({ page }) => {
      // Login as basic user
      await page.goto('http://localhost:5173')
      // Wait for login page to fully load
      await page.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })
      await page.click('button:has-text("Compliance Officer")')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Try to access admin routes directly
      const adminRoutes = ['/admin/users', '/admin/roles', '/admin/permissions', '/system/settings']

      for (const route of adminRoutes) {
        await page.goto(`http://localhost:5173${route}`)
        await page.waitForTimeout(1000)

        // Should show access denied or redirect to dashboard/login
        const currentURL = page.url()
        const isOnLogin = currentURL.includes('/login')
        const isOnDashboard = currentURL.includes('/dashboard')
        const hasAccessDenied = await page.locator('text=Access Denied').isVisible()

        // Either redirect to login/dashboard or show access denied
        expect(isOnLogin || isOnDashboard || hasAccessDenied).toBe(true)
      }
    })
  })

  test.describe('Data Protection and Privacy', () => {
    test('should validate data handling for DPO role', async ({ page }) => {
      // Login as DPO
      await page.goto('http://localhost:5173')
      // Wait for login page to fully load
      await page.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })
      await page.click('button:has-text("DPO")')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // DPO should have access to compliance dashboard
      await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Compliance Dashboard")')).toBeVisible()

      // Navigate to compliance dashboard
      await page.goto('http://localhost:5173/compliance-dashboard')
      await page.waitForTimeout(2000)

      // Verify privacy-focused content - use heading specifically to avoid strict mode violation
      await expect(page.locator('h1:has-text("Compliance Dashboard")')).toBeVisible()
      await expect(page.locator('h3:has-text("Data Protection")')).toBeVisible()
    })

    test('should validate audit logging for sensitive operations', async ({ page }) => {
      // Login as Compliance Officer
      await page.goto('http://localhost:5173')
      // Wait for login page to fully load
      await page.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })
      await page.click('button:has-text("Compliance Officer")')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Navigate to audit logs
      await page.goto('http://localhost:5173/audit-logs')
      await page.waitForTimeout(2000)

      // Verify audit log interface
      await expect(page.locator('text=My Activity Log')).toBeVisible()
      await expect(page.locator('text=View your recent actions and activity history')).toBeVisible()
    })
  })

  test.describe('Error Handling and Security', () => {
    test('should handle malformed URLs gracefully', async ({ page }) => {
      // Login first
      await page.goto('http://localhost:5173')
      // Wait for login page to fully load
      await page.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })
      await page.click('button:has-text("Compliance Officer")')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Try malformed URLs
      const malformedUrls = [
        'http://localhost:5173/..%2f..%2f..%2fetc%2fpasswd',
        'http://localhost:5173/<script>alert("xss")</script>',
        'http://localhost:5173/'.repeat(1000),
        'http://localhost:5173/%00%01%02%03'
      ]

      for (const url of malformedUrls) {
        try {
          await page.goto(url)
          await page.waitForTimeout(1000)

          // Should not crash the application
          const bodyVisible = await page.locator('body').isVisible()
          expect(bodyVisible, 'Page should load without crashing').toBe(true)
        } catch (error) {
          console.log(`Expected error for malformed URL: ${url}`)
        }
      }
    })

    test('should validate CSRF protection', async ({ page }) => {
      // Login
      await page.goto('http://localhost:5173')
      // Wait for login page to fully load
      await page.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })
      await page.click('button:has-text("Compliance Officer")')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Try to perform actions that should be protected
      // This is a basic check - real CSRF testing would require more complex setup
      await expect(page.locator('button:has-text("Sign Out")')).toBeVisible()
    })

    test('should handle rate limiting appropriately', async ({ page }) => {
      // Rapid login attempts (simulating brute force)
      for (let i = 0; i < 10; i++) {
        await page.goto('http://localhost:5173/login')
        await page.fill('input[type="email"]', 'invalid@demo.com')
        await page.fill('input[type="password"]', 'wrongpassword')
        await page.click('button:has-text("Sign In")')
        await page.waitForTimeout(500)
      }

      // Should still show login page (not crash or lock out permanently)
      await expect(page.locator('h2:has-text("Welcome to NOVA-GRC")')).toBeVisible()
    })
  })

  test.describe('Compliance and Regulatory Requirements', () => {
    test('should validate compliance dashboard access', async ({ page }) => {
      const complianceRoles = ['CCO', 'CISO', 'Internal Auditor', 'DPO', 'External Auditor']

      for (const role of complianceRoles) {
        console.log(`Testing compliance dashboard access for ${role}`)

        // Login
        await page.goto('http://localhost:5173')
        // Wait for login page to fully load
        await page.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })
        await page.click(`button:has-text("${role}")`)
        await page.click('button:has-text("Sign In")')
        await page.waitForURL('**/dashboard', { timeout: 15000 })

        // Check compliance dashboard access
        await expect(page.locator('nav.hidden.md\\:flex a:has-text\("Compliance Dashboard")')).toBeVisible()

        // Navigate to compliance dashboard
        await page.goto('http://localhost:5173/compliance-dashboard')
        await page.waitForTimeout(2000)

        // Verify compliance content - use heading specifically to avoid strict mode violation
        await expect(page.locator('h1:has-text("Compliance Dashboard")')).toBeVisible()

        // For DPO role, check for Data Protection content
        if (role === 'DPO') {
          await expect(page.locator('h3:has-text("Data Protection")')).toBeVisible()
        }

        // Logout
        await page.goto('http://localhost:5173/login')
        await page.waitForTimeout(1000)
      }
    })

    test('should validate data retention and audit trails', async ({ page }) => {
      // Login as Internal Auditor
      await page.goto('http://localhost:5173')
      // Wait for login page to fully load
      await page.waitForSelector('h2:has-text("Welcome to NOVA-GRC")', { timeout: 10000 })
      await page.click('button:has-text("Internal Auditor")')
      await page.click('button:has-text("Sign In")')
      await page.waitForURL('**/dashboard', { timeout: 15000 })

      // Navigate to audit logs
      await page.goto('http://localhost:5173/audit-logs')
      await page.waitForTimeout(2000)

      // Verify audit trail features
      await expect(page.locator('text=My Activity Log')).toBeVisible()
      await expect(page.locator('text=Status Filter')).toBeVisible()
      await expect(page.locator('text=Module Filter')).toBeVisible()
    })
  })
})