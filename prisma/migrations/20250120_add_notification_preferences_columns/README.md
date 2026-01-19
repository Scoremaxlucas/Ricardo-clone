# Add Notification Preferences Columns

This migration adds the missing notification preference columns to the `user_preferences` table.

## Problem
The `user_preferences` table was created without the notification preference columns (`emailOnNewMessage`, `emailOnNewBid`, etc.), causing errors when users try to save their notification preferences.

## Solution
This migration adds all 12 notification preference columns with appropriate defaults.

## Running the Migration

### Option 1: Using Prisma Migrate (Recommended)
```bash
npx prisma migrate deploy
```

### Option 2: Manual SQL Execution
If you need to run this manually, execute the SQL in `migration.sql` directly against your database:

```bash
psql $DATABASE_URL -f migration.sql
```

Or copy the SQL content and run it in your database management tool.

## Columns Added
- `emailOnNewMessage` (Boolean, default: true)
- `emailOnNewBid` (Boolean, default: true)
- `emailOnNewOffer` (Boolean, default: true)
- `emailOnSaleCompleted` (Boolean, default: true)
- `emailOnOutbid` (Boolean, default: true)
- `emailOnAuctionEnding` (Boolean, default: true)
- `emailOnPurchase` (Boolean, default: true)
- `emailOnShipping` (Boolean, default: true)
- `emailOnSearchMatch` (Boolean, default: true)
- `emailOnFavoritePriceChange` (Boolean, default: false)
- `emailMarketing` (Boolean, default: false)
- `emailDigestFrequency` (Text, default: 'instant')

## Verification
After running the migration, verify the columns exist:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_preferences'
AND column_name LIKE 'email%';
```
