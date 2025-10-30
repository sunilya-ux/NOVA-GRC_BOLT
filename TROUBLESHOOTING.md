# Troubleshooting Guide

## Issue: Navigation Links Not Showing / Only "My Activity" Visible

### Root Cause
The browser may have cached the old authentication state or the old build. The application needs a fresh start.

### Solution Steps

#### Step 1: Clear Browser Cache & Logout
1. **Log out** from the current session
2. **Clear browser cache** (or open in Incognito/Private mode)
3. **Hard refresh** the page (Ctrl+Shift+R on Windows/Linux, Cmd+Shift+R on Mac)

#### Step 2: Verify Build
```bash
npm run build
```

Should complete without errors.

#### Step 3: Login Again
1. Go to `/login`
2. Login as `officer@demo.com` / `demo123`
3. Should see the following navigation links:
   - Dashboard
   - Upload
   - Processing
   - Review
   - Search
   - Analytics
   - My Activity

## Issue: "My Activity" Page Shows Error

### Fixed in Latest Build
The error "Cannot read properties of null (reading 'replace')" has been fixed.

**Changes Made:**
- Added null checks for `log.action`, `log.module_name`, `log.resource_type`, and `log.resource_id`
- All fields now display "N/A" if null instead of crashing

### Verification
After rebuilding and clearing cache:
1. Go to "My Activity" page
2. Should load without errors
3. If no audit logs exist, will show "No activity logs found" message

## Issue: Review Page Shows No Documents

### Possible Causes

#### 1. No AI Decisions Created Yet
**Check:**
```sql
SELECT COUNT(*) FROM decisions WHERE status = 'ai_proposed';
```

**Should return:** At least 4 decisions

**If 0:** Run the SQL commands from `COMPLIANCE_OFFICER_FIXES.md` to create sample decisions.

#### 2. Documents Not Assigned to Current User
**Check:**
```sql
SELECT d.document_id, d.document_type, d.assigned_to, u.email
FROM documents d
LEFT JOIN users u ON d.assigned_to = u.user_id
WHERE d.document_id IN (
  SELECT document_id FROM decisions WHERE status = 'ai_proposed'
);
```

**Verify:** Documents should be assigned to `officer@demo.com` (user_id: `96b0536e-f650-408d-843f-ead7b8284894`)

#### 3. RLS Blocking Access
**Check RLS policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'documents';
```

**Should have:** Policy allowing officers to see documents where `assigned_to = auth.uid()`

## Issue: Manager Approval Page Not Visible

### Expected Behavior
- **Compliance Officer:** Should NOT see "Approvals" link (correct)
- **Compliance Manager:** Should see "Approvals" link
- **CCO:** Should see "Approvals" link

### Verification
1. Login as `manager@demo.com` / `demo123`
2. Should see "Approvals" in navigation
3. Page should show documents where `decisions.status = 'pending_manager_approval'`

## Testing Checklist

### ✅ Compliance Officer Workflow

1. **Login**
   ```
   Email: officer@demo.com
   Password: demo123
   ```

2. **Check Navigation**
   - [ ] Dashboard
   - [ ] Upload
   - [ ] Processing
   - [ ] Review ← CRITICAL
   - [ ] Search
   - [ ] Analytics
   - [ ] My Activity

3. **Test Review Page**
   - [ ] Go to /review
   - [ ] Should see list of documents with AI decisions
   - [ ] Click a document
   - [ ] Should see AI verdict, confidence, reasoning
   - [ ] Select AGREE or DISAGREE
   - [ ] Add comment (required for DISAGREE)
   - [ ] Submit
   - [ ] Document should disappear from list

4. **Test My Activity**
   - [ ] Go to /audit-logs
   - [ ] Page loads without errors
   - [ ] Shows recent actions (login, reviews, etc.)
   - [ ] Can filter by status
   - [ ] Can filter by module

### ✅ Compliance Manager Workflow

1. **Login**
   ```
   Email: manager@demo.com
   Password: demo123
   ```

2. **Check Navigation**
   - [ ] Dashboard
   - [ ] Upload
   - [ ] Processing
   - [ ] Review
   - [ ] Approvals ← CRITICAL (new)
   - [ ] Search
   - [ ] Analytics
   - [ ] Bulk
   - [ ] My Activity

3. **Test Approvals Page**
   - [ ] Go to /approvals
   - [ ] Should see documents where officer disagreed
   - [ ] Click a document
   - [ ] Should see AI reasoning + Officer comment
   - [ ] Select APPROVE/REJECT/ESCALATE
   - [ ] Add justification (required)
   - [ ] Submit
   - [ ] Document should disappear from list

## Database Quick Checks

### Check Decisions Exist
```sql
SELECT
  d.document_id,
  d.document_type,
  d.status as doc_status,
  dec.ai_verdict,
  dec.ai_confidence,
  dec.status as decision_status,
  u.email as assigned_to_email
FROM documents d
JOIN decisions dec ON d.document_id = dec.document_id
JOIN users u ON d.assigned_to = u.user_id
WHERE dec.status IN ('ai_proposed', 'pending_manager_approval')
ORDER BY d.created_at DESC;
```

Should show at least 5 documents.

### Check User Roles
```sql
SELECT u.email, r.role_name, u.is_active
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.email IN ('officer@demo.com', 'manager@demo.com');
```

Should show:
- officer@demo.com → compliance_officer → is_active: true
- manager@demo.com → compliance_manager → is_active: true

### Check Audit Logs
```sql
SELECT action, module_name, success, timestamp
FROM audit_logs
WHERE user_id = '96b0536e-f650-408d-843f-ead7b8284894'
ORDER BY timestamp DESC
LIMIT 5;
```

Should show recent actions for officer@demo.com.

## Common Issues & Solutions

### Issue: "Something went wrong" Error
**Solution:** Check browser console for specific error message. Most common:
- Null pointer errors → Fixed in latest build
- RLS policy blocking access → Check assigned_to field
- Auth token expired → Logout and login again

### Issue: Empty Navigation
**Solution:**
1. Check `localStorage` has `nova-grc-auth` key
2. Verify user object has `role_name` field
3. Clear localStorage and login again

### Issue: Cannot See Own Documents
**Solution:**
1. Check `assigned_to` field in documents table
2. Verify RLS policies allow access
3. Check `user_id` in browser localStorage matches database

## Manual Reset (If All Else Fails)

1. **Clear Application State**
   ```javascript
   // In browser console
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

2. **Rebuild Application**
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

3. **Login Fresh**
   - Go to /login
   - Enter credentials
   - Check navigation links appear

## Support Contacts

If issues persist after following this guide:
1. Check `COMPLIANCE_OFFICER_FIXES.md` for detailed implementation notes
2. Review `IMPLEMENTATION_COMPLETE.md` for architecture overview
3. Check database logs for RLS policy violations

## Latest Build Info

- **Build Date:** 2025-10-30
- **Version:** 1.0.0
- **Key Fixes:**
  - ✅ AuditLogs null pointer error fixed
  - ✅ Review page filters by assigned_to
  - ✅ Manager approval page created
  - ✅ Navigation permissions configured
  - ✅ Sample decisions created in database
