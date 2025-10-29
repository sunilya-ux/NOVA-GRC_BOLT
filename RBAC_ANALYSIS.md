# RBAC Policy Analysis - Document vs Implementation

## Key Discrepancies Found

### 1. **Role Definitions Mismatch**
**Document Specifies:**
- 9 roles total with specific role types and priorities
- Roles: Compliance Officer, Manager, CCO, Admin, ML Engineer, CISO, Internal Auditor, DPO, External Auditor

**Current Implementation:**
- Only 5 roles: compliance_officer, compliance_manager, cco, system_admin, internal_auditor
- ❌ **Missing**: ml_engineer, ciso, dpo, external_auditor

### 2. **Users Table Schema Differences**
**Document Requires:**
- `role_name` (VARCHAR) - Direct role reference
- Should integrate with Supabase Auth

**Current Implementation:**
- `role_id` (INTEGER FK) - Indirect reference
- `password_hash` field (not needed with Supabase Auth)
- ✅ Has proper structure but uses FK instead of role name

### 3. **Documents Table Missing Fields**
**Document Requires:**
- `file_name` - Original filename
- Should support multi-user assignment

**Current Implementation:**
- ✅ Has `file_path` but missing `file_name`
- ✅ Has `assigned_to` but doesn't show multi-user support

### 4. **RLS Policies Coverage**
**Document Requires:**
- Policies for all 9 roles
- Specific data access patterns per role type

**Current Implementation:**
- ✅ Policies for compliance_officer, compliance_manager, executives
- ❌ Missing policies for: ml_engineer, dpo, external_auditor, ciso (separate policies)

### 5. **Permission Mappings Incomplete**
**Document Specifies:**
- Detailed permission matrix for all 9 roles
- Specific module access controls

**Current Implementation:**
- Basic permissions seeded
- ❌ Missing mappings for: ml_engineer, dpo, external_auditor, ciso

## Recommendations

### HIGH PRIORITY
1. ✅ Add missing 4 roles (ml_engineer, ciso, dpo, external_auditor)
2. ✅ Update RLS policies to cover all 9 roles
3. ✅ Add role-permission mappings for new roles
4. ✅ Add `file_name` field to documents table

### MEDIUM PRIORITY
5. Consider adding `role_name` to users table for performance (denormalized)
6. Add more granular permissions based on document's access matrix
7. Implement CISO-specific security monitoring permissions

### LOW PRIORITY
8. Remove `password_hash` from users table (use Supabase Auth)
9. Add role hierarchy validation
10. Implement temporary role assignments (external_auditor use case)

## Alignment Status

| Component | Status | Notes |
|-----------|--------|-------|
| Core Schema | 🟡 Partial | Missing 4 roles |
| RLS Policies | 🟡 Partial | Covers 5 of 9 roles |
| Permissions | 🟡 Partial | Basic set only |
| Audit Logs | ✅ Complete | Matches document |
| Sessions | ✅ Complete | Matches document |
| Violations | ✅ Complete | Matches document |

**Overall Alignment: 70%**
