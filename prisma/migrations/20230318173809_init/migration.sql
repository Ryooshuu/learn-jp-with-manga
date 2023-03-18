-- CreateEnum
CREATE TYPE "MangaDemographic" AS ENUM ('SHOUNEN', 'SHOUJO', 'SEINEN', 'JOSEI', 'KODOMO');

-- CreateEnum
CREATE TYPE "MangaStatus" AS ENUM ('ONGOING', 'COMPLETED', 'HIATUS', 'CANCELLED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "safe_username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "avatar_hash" TEXT,
    "country_code" TEXT NOT NULL DEFAULT 'XX',
    "permissions_grant" INTEGER NOT NULL DEFAULT 0,
    "permissions_revoke" INTEGER NOT NULL DEFAULT 0,
    "flags" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "priority" INTEGER NOT NULL,
    "hue" INTEGER NOT NULL,
    "icon" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "permissions_grant" INTEGER NOT NULL DEFAULT 0,
    "permissions_revoke" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "last_active" TIMESTAMP(3),
    "token" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT 'XX',
    "account_id" UUID NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" UUID NOT NULL,
    "volume_id" UUID NOT NULL,
    "manga_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "image_hash" TEXT NOT NULL,
    "annotation_hash" TEXT NOT NULL,
    "chapter_id" UUID NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "hash" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "mangas" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "alternative_titles" TEXT[],
    "authors" TEXT[],
    "artists" TEXT[],
    "description" TEXT NOT NULL DEFAULT '',
    "genres" TEXT[],
    "themes" TEXT[],
    "demographic" "MangaDemographic",
    "status" "MangaStatus",
    "cover_hash" TEXT,
    "publicized_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mangas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volumes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AccountToGroup" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_username_key" ON "accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_safe_username_key" ON "accounts"("safe_username");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "files_hash_key" ON "files"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "volumes_name_key" ON "volumes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_AccountToGroup_AB_unique" ON "_AccountToGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_AccountToGroup_B_index" ON "_AccountToGroup"("B");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_volume_id_fkey" FOREIGN KEY ("volume_id") REFERENCES "volumes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_manga_id_fkey" FOREIGN KEY ("manga_id") REFERENCES "mangas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountToGroup" ADD CONSTRAINT "_AccountToGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountToGroup" ADD CONSTRAINT "_AccountToGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
