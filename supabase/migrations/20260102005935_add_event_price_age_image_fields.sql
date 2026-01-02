-- Add price, age_range, and image_url fields to events table
ALTER TABLE events
ADD COLUMN price text,
ADD COLUMN age_range text,
ADD COLUMN image_url text;

-- Add comments for documentation
COMMENT ON COLUMN events.price IS 'Admission price, e.g., "Free", "$15", "$10-20"';
COMMENT ON COLUMN events.age_range IS 'Recommended age range, e.g., "All ages", "3-8 years"';
COMMENT ON COLUMN events.image_url IS 'URL to the event image';
