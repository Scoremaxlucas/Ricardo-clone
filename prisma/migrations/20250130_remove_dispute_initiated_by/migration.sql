-- Rollback: Remove disputeInitiatedBy column if it exists
-- This migration removes the column that was temporarily added but is not in the schema

-- Check if column exists and remove it
-- Note: PostgreSQL doesn't support IF EXISTS for ALTER TABLE DROP COLUMN
-- So we use a DO block to check first
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'purchases' 
        AND column_name = 'disputeInitiatedBy'
    ) THEN
        ALTER TABLE "purchases" DROP COLUMN "disputeInitiatedBy";
        RAISE NOTICE 'Column disputeInitiatedBy removed from purchases table';
    ELSE
        RAISE NOTICE 'Column disputeInitiatedBy does not exist, skipping removal';
    END IF;
END $$;
