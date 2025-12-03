-- CreateTable
CREATE TABLE `Software` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Version` (
    `id` VARCHAR(191) NOT NULL,
    `softwareId` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `releaseDate` DATETIME(3) NOT NULL,
    `changelog` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccessToken` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `softwareId` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `permissions` JSON NOT NULL DEFAULT (CAST('[]' AS JSON)),
    `status` VARCHAR(191) NOT NULL,
    `owner` VARCHAR(191) NULL,
    `blockchainTxHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AccessToken_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `tokenId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `blockchainTxHash` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'USER',
    `avatar` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLogin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserPermission` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `permission` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserPermission_userId_permission_resource_key`(`userId`, `permission`, `resource`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `permission` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RolePermission_role_permission_resource_key`(`role`, `permission`, `resource`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Software_createdAt_idx` ON `Software`(`createdAt`);

-- CreateIndex
CREATE INDEX `Version_softwareId_idx` ON `Version`(`softwareId`);

-- CreateIndex
CREATE INDEX `Version_releaseDate_idx` ON `Version`(`releaseDate`);

-- CreateIndex
CREATE INDEX `AccessToken_status_idx` ON `AccessToken`(`status`);

-- CreateIndex
CREATE INDEX `AccessToken_softwareId_idx` ON `AccessToken`(`softwareId`);

-- CreateIndex
CREATE INDEX `AccessToken_versionId_idx` ON `AccessToken`(`versionId`);

-- CreateIndex
CREATE INDEX `AccessToken_expiresAt_idx` ON `AccessToken`(`expiresAt`);

-- CreateIndex
CREATE INDEX `AccessToken_createdAt_idx` ON `AccessToken`(`createdAt`);

-- CreateIndex
CREATE INDEX `AccessToken_owner_idx` ON `AccessToken`(`owner`);

-- CreateIndex
CREATE INDEX `AuditLog_tokenId_idx` ON `AuditLog`(`tokenId`);

-- CreateIndex
CREATE INDEX `AuditLog_action_idx` ON `AuditLog`(`action`);

-- CreateIndex
CREATE INDEX `AuditLog_timestamp_idx` ON `AuditLog`(`timestamp`);

-- CreateIndex
CREATE INDEX `User_role_idx` ON `User`(`role`);

-- CreateIndex
CREATE INDEX `User_isActive_idx` ON `User`(`isActive`);

-- CreateIndex
CREATE INDEX `RolePermission_role_idx` ON `RolePermission`(`role`);

-- AddForeignKey
ALTER TABLE `Version` ADD CONSTRAINT `Version_softwareId_fkey` FOREIGN KEY (`softwareId`) REFERENCES `Software`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccessToken` ADD CONSTRAINT `AccessToken_softwareId_fkey` FOREIGN KEY (`softwareId`) REFERENCES `Software`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccessToken` ADD CONSTRAINT `AccessToken_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `Version`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

