-- CreateTable
CREATE TABLE `Software` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Version` (
    `id` CHAR(36) NOT NULL,
    `softwareId` CHAR(36) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `releaseDate` DATETIME(3) NOT NULL,
    `changelog` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `Version_softwareId_idx` (`softwareId`),
    CONSTRAINT `Version_softwareId_fkey` FOREIGN KEY (`softwareId`) REFERENCES `Software`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccessToken` (
    `id` CHAR(36) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `softwareId` CHAR(36) NOT NULL,
    `versionId` CHAR(36) NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `permissions` JSON NOT NULL DEFAULT ('[]'),
    `status` ENUM('ACTIVE', 'EXPIRED', 'REVOKED') NOT NULL,
    `owner` VARCHAR(191) NULL,
    `blockchainTxHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `AccessToken_token_key` (`token`),
    INDEX `AccessToken_softwareId_idx` (`softwareId`),
    INDEX `AccessToken_versionId_idx` (`versionId`),
    CONSTRAINT `AccessToken_softwareId_fkey` FOREIGN KEY (`softwareId`) REFERENCES `Software`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `AccessToken_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `Version`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` CHAR(36) NOT NULL,
    `tokenId` CHAR(36) NOT NULL,
    `action` ENUM('VALIDATE', 'EXTEND', 'REVOKE', 'EXCHANGE', 'CREATE') NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `blockchainTxHash` VARCHAR(191) NULL,
    PRIMARY KEY (`id`),
    INDEX `AuditLog_tokenId_idx` (`tokenId`),
    CONSTRAINT `AuditLog_tokenId_fkey` FOREIGN KEY (`tokenId`) REFERENCES `AccessToken`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
