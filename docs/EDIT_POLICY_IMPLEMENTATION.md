# Edit Policy Implementation - Progress Summary

## ✅ Completed

### 1. EditPolicy Module (`src/lib/edit-policy.ts`)

- ✅ Ricardo-like editing rules implemented
- ✅ Policy levels: FULL, PUBLISHED_LIMITED, LIMITED_APPEND_ONLY, READ_ONLY
- ✅ Field-level locks and step locks defined
- ✅ Policy computation based on listing state

### 2. Server-Side API Enforcement

- ✅ **Edit Status API** (`src/app/api/watches/[id]/edit-status/route.ts`)
  - Returns EditPolicy to frontend
  - Includes listing state

- ✅ **Edit API** (`src/app/api/watches/[id]/edit/route.ts`)
  - Computes policy server-side
  - Enforces field-level validation
  - Handles append-only mode (descriptionAddendum + newImages)
  - Blocks forbidden field updates
  - Category and booster updates respect policy
  - History tracking includes policy level

### 3. Wizard Components Updated

- ✅ **StepProgress** - Shows locked steps with lock icons
- ✅ **PolicyBanner** - Displays policy restrictions
- ✅ **StepCategorySelection** - Supports locked category state
- ✅ **StepDetails** - Supports append-only description mode
- ✅ **StepImages** - Supports append-only images (add only, no delete/reorder)
- ✅ **StepPrice** - Supports locked auction structure fields
- ✅ **StepShippingPayment** - Supports locked shipping methods
- ✅ **WizardFooter** - Shows correct button text for edit mode

## 🚧 Remaining Work

### 4. Edit Page Refactoring (`src/app/my-watches/edit/[id]/page.tsx`)

The current edit page (1357 lines) uses a custom form layout. It needs to be refactored to:

1. **Load watch data and policy**

   ```typescript
   // Fetch watch + policy on mount
   const { policy, listingState } = await fetch(`/api/watches/${id}/edit-status`)
   ```

2. **Initialize wizard with watch data**
   - Map watch data to wizard formData format
   - Set current step based on policy (skip locked steps if needed)

3. **Use wizard components**
   - Replace custom form with wizard steps
   - Pass `mode="edit"` and `policy` props to all steps
   - Show PolicyBanner at top

4. **Handle submission**
   - For LIMITED_APPEND_ONLY: send `descriptionAddendum` and `newImages`
   - For other modes: send normal field updates
   - Handle policy violations gracefully

## Implementation Notes

### Append-Only Mode

- **Description**: Show existing description as read-only, add separate `descriptionAddendum` textarea
- **Images**: Only allow adding new images via `newImages` array, never delete/reorder
- **Server**: Appends addendum with timestamp separator, merges images by appending only

### Policy Enforcement

- **UI**: Disabled inputs, lock icons, banners
- **Server**: Rejects forbidden updates with clear error messages
- **Both**: Must be in sync (server is source of truth)

## Testing Checklist

- [ ] DRAFT: Full editing works
- [ ] PUBLISHED + FIXED PRICE: Category/sale type locked, others editable
- [ ] PUBLISHED + AUCTION (no bids): Category/sale type + auction structure locked
- [ ] PUBLISHED + AUCTION (with bids): Only append-only works
- [ ] BUYER COMMITMENT: Read-only, no edits possible
- [ ] Server rejects forbidden field updates
- [ ] UI shows correct locked states
- [ ] Mobile layout works correctly
