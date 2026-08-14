-- Fix the broken default service image URL. The previous default
-- (https://www.magnific.com/free-photos-vectors/electrical-instrument)
-- points at a non-image HTML page, so the cards showed the broken-image
-- fallback. Replace the column default with a working Unsplash image and
-- backfill every existing row so live services render correctly.
ALTER TABLE "Service" ALTER COLUMN "image" SET DEFAULT 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80&auto=format&fit=crop';

UPDATE "Service"
SET    "image" = 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80&auto=format&fit=crop'
WHERE  "image" LIKE '%magnific.com%';
