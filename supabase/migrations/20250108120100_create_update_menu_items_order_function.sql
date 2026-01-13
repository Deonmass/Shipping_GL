-- Create a function to update multiple menu items' order in a single transaction
CREATE OR REPLACE FUNCTION public.update_menu_items_order(
  items_to_update JSONB[]
) 
RETURNS void 
LANGUAGE plpgsql 
AS $$
DECLARE
  item JSONB;
BEGIN
  -- Loop through each item in the input array
  FOREACH item IN ARRAY items_to_update
  LOOP
    -- Update the order for each menu item
    UPDATE public.menu_visibility
    SET "order" = (item->>'order')::integer,
        updated_at = NOW()
    WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.update_menu_items_order IS 'Updates the order of multiple menu items in a single transaction';

-- Grant execute permission to authenticated users
ALTER FUNCTION public.update_menu_items_order(JSONB[]) 
SECURITY DEFINER 
SET search_path = public;
