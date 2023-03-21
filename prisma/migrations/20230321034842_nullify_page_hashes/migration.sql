-- AlterTable
ALTER TABLE "pages" ALTER COLUMN "image_hash" DROP NOT NULL,
ALTER COLUMN "annotation_hash" DROP NOT NULL;
