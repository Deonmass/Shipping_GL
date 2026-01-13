-- Add order column to menu_visibility table
ALTER TABLE public.menu_visibility 
ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- Add comment for the new column
COMMENT ON COLUMN public.menu_visibility."order" IS 'Order of the menu item in the navigation';

-- Create an index on the order column for better performance
CREATE INDEX IF NOT EXISTS idx_menu_visibility_order ON public.menu_visibility("order");
