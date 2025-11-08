-- WebApp Manager Database - Schema Only
-- MySQL/MariaDB compatible for phpMyAdmin
-- Generated: 2025-01-XX

-- ============================================
-- DATABASE CREATION (Uncomment if needed)
-- ============================================
-- CREATE DATABASE IF NOT EXISTS webapp_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE webapp_manager;

-- ============================================
-- DROP TABLES (if they exist)
-- ============================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `AuditLog`;
DROP TABLE IF EXISTS `AccessToken`;
DROP TABLE IF EXISTS `Version`;
DROP TABLE IF EXISTS `Software`;
DROP TABLE IF EXISTS `UserPermission`;
DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `Settings`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Settings table
CREATE TABLE `Settings` (
  `id` VARCHAR(36) NOT NULL,
  `key` VARCHAR(255) NOT NULL,
  `value` TEXT,
  `category` VARCHAR(255),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Settings_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User table
CREATE TABLE `User` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'MANAGER', 'USER') NOT NULL DEFAULT 'USER',
  `avatar` VARCHAR(255),
  `phone` VARCHAR(255),
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `lastLogin` DATETIME(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_role_idx` (`role`),
  KEY `User_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- UserPermission table
CREATE TABLE `UserPermission` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `permission` VARCHAR(255) NOT NULL,
  `resource` VARCHAR(255),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserPermission_userId_permission_resource_key` (`userId`, `permission`, `resource`),
  CONSTRAINT `UserPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Software table
CREATE TABLE `Software` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Software_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Version table
CREATE TABLE `Version` (
  `id` VARCHAR(36) NOT NULL,
  `softwareId` VARCHAR(36) NOT NULL,
  `version` VARCHAR(255) NOT NULL,
  `releaseDate` DATETIME(3) NOT NULL,
  `changelog` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Version_softwareId_idx` (`softwareId`),
  KEY `Version_releaseDate_idx` (`releaseDate`),
  CONSTRAINT `Version_softwareId_fkey` FOREIGN KEY (`softwareId`) REFERENCES `Software` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AccessToken table
CREATE TABLE `AccessToken` (
  `id` VARCHAR(36) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `softwareId` VARCHAR(36) NOT NULL,
  `versionId` VARCHAR(36),
  `expiresAt` DATETIME(3) NOT NULL,
  `permissions` JSON NOT NULL DEFAULT ('[]'),
  `status` ENUM('ACTIVE', 'EXPIRED', 'REVOKED') NOT NULL,
  `owner` VARCHAR(255),
  `blockchainTxHash` VARCHAR(255),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `AccessToken_token_key` (`token`),
  KEY `AccessToken_status_idx` (`status`),
  KEY `AccessToken_softwareId_idx` (`softwareId`),
  KEY `AccessToken_versionId_idx` (`versionId`),
  KEY `AccessToken_expiresAt_idx` (`expiresAt`),
  KEY `AccessToken_createdAt_idx` (`createdAt`),
  KEY `AccessToken_owner_idx` (`owner`),
  CONSTRAINT `AccessToken_softwareId_fkey` FOREIGN KEY (`softwareId`) REFERENCES `Software` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `AccessToken_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `Version` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AuditLog table
CREATE TABLE `AuditLog` (
  `id` VARCHAR(36) NOT NULL,
  `tokenId` VARCHAR(36) NOT NULL,
  `action` ENUM('VALIDATE', 'EXTEND', 'REVOKE', 'EXCHANGE', 'CREATE') NOT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ipAddress` VARCHAR(255),
  `userAgent` VARCHAR(255),
  `blockchainTxHash` VARCHAR(255),
  PRIMARY KEY (`id`),
  KEY `AuditLog_tokenId_idx` (`tokenId`),
  KEY `AuditLog_action_idx` (`action`),
  KEY `AuditLog_timestamp_idx` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- END OF SCHEMA
-- ============================================
