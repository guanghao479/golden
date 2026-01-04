-- Add image_url, price, and age_range columns to places table
ALTER TABLE places ADD COLUMN image_url text;
ALTER TABLE places ADD COLUMN price text;
ALTER TABLE places ADD COLUMN age_range text;
