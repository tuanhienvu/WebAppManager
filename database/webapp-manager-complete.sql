-- WebApp Manager Database - Complete Setup for phpMyAdmin
-- MySQL/MariaDB compatible
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
-- INSERT SAMPLE DATA
-- ============================================

-- Insert Users (with hashed passwords)
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`, `phone`, `isActive`, `createdAt`, `updatedAt`) VALUES
(UUID(), 'vuleitsolution@gmail.com', 'admin', '$2b$10$np903vxy611mS4MQQ67NquPA5OtSGmz3Gkte8pkAsL3aVER0XHzai', 'ADMIN', '+84963373213', 1, NOW(3), NOW(3)),
(UUID(), 'manager1@webappmanager.com', 'Manager User 1', '$2b$10$4fuC7jCQrbhwuGN/MqL73Oyf/vP29SV3xNaEPKx1OeiWg5bb0kPQq', 'MANAGER', '+1 (555) 333-3333', 1, NOW(3), NOW(3)),
(UUID(), 'user1@webappmanager.com', 'Regular User 1', '$2b$10$9V1kByd4ehLGUUE60US4huT3fJMY.X6hpc6S0dy7vD9KshF/EzAH6', 'USER', '+1 (555) 555-5555', 1, NOW(3), NOW(3));

-- Get User IDs for reference
SET @admin_user_id = (SELECT `id` FROM `User` WHERE `email` = 'vuleitsolution@gmail.com' LIMIT 1);
SET @manager_user_id = (SELECT `id` FROM `User` WHERE `email` = 'manager1@webappmanager.com' LIMIT 1);
SET @regular_user_id = (SELECT `id` FROM `User` WHERE `email` = 'user1@webappmanager.com' LIMIT 1);

-- Insert Settings
INSERT INTO `Settings` (`id`, `key`, `value`, `category`, `createdAt`, `updatedAt`) VALUES
(UUID(), 'companyName', 'WebApp Manager', 'company', NOW(3), NOW(3)),
(UUID(), 'slogan', 'Professional Web Application Management Platform', 'company', NOW(3), NOW(3)),
(UUID(), 'logo', NULL, 'company', NOW(3), NOW(3)),
(UUID(), 'address', '123 Business Street, Tech City, TC 12345', 'company', NOW(3), NOW(3)),
(UUID(), 'email', 'contact@webappmanager.com', 'contact', NOW(3), NOW(3)),
(UUID(), 'phone', '+1 (555) 123-4567', 'contact', NOW(3), NOW(3)),
(UUID(), 'mobile', '+1 (555) 987-6543', 'contact', NOW(3), NOW(3)),
(UUID(), 'socialLinks', '[{"platform":"Facebook","url":"https://facebook.com/webappmanager","icon":"facebook"},{"platform":"Twitter","url":"https://twitter.com/webappmanager","icon":"twitter"},{"platform":"LinkedIn","url":"https://linkedin.com/company/webappmanager","icon":"linkedin"},{"platform":"GitHub","url":"https://github.com/webappmanager","icon":"github"}]', 'social', NOW(3), NOW(3));

-- Insert User Permissions
-- Admin User Permissions (Full access)
INSERT INTO `UserPermission` (`id`, `userId`, `permission`, `resource`, `createdAt`, `updatedAt`) VALUES
(UUID(), @admin_user_id, 'MANAGE_SOFTWARE', 'software', NOW(3), NOW(3)),
(UUID(), @admin_user_id, 'MANAGE_TOKENS', 'tokens', NOW(3), NOW(3)),
(UUID(), @admin_user_id, 'VIEW_AUDIT_LOGS', 'audit', NOW(3), NOW(3)),
(UUID(), @admin_user_id, 'MANAGE_USERS', 'users', NOW(3), NOW(3)),
(UUID(), @admin_user_id, 'CONFIGURE_SYSTEM', 'system', NOW(3), NOW(3)),
(UUID(), @admin_user_id, 'EXPORT_DATA', 'data', NOW(3), NOW(3)),
(UUID(), @admin_user_id, 'ACCESS_API_DOCS', 'api', NOW(3), NOW(3)),
(UUID(), @admin_user_id, 'VIEW_REPORTS', 'reports', NOW(3), NOW(3)),
(UUID(), @admin_user_id, 'MANAGE_SETTINGS', 'settings', NOW(3), NOW(3));

-- Manager User Permissions (Limited access)
INSERT INTO `UserPermission` (`id`, `userId`, `permission`, `resource`, `createdAt`, `updatedAt`) VALUES
(UUID(), @manager_user_id, 'VIEW_SOFTWARE', 'software', NOW(3), NOW(3)),
(UUID(), @manager_user_id, 'CREATE_TOKENS', 'tokens', NOW(3), NOW(3)),
(UUID(), @manager_user_id, 'VIEW_AUDIT_LOGS', 'audit', NOW(3), NOW(3)),
(UUID(), @manager_user_id, 'VIEW_USERS', 'users', NOW(3), NOW(3)),
(UUID(), @manager_user_id, 'ACCESS_API_DOCS', 'api', NOW(3), NOW(3)),
(UUID(), @manager_user_id, 'MANAGE_SOCIAL_LINKS', 'settings', NOW(3), NOW(3));

-- Regular User Permissions (Basic access)
INSERT INTO `UserPermission` (`id`, `userId`, `permission`, `resource`, `createdAt`, `updatedAt`) VALUES
(UUID(), @regular_user_id, 'VIEW_SOFTWARE', 'software', NOW(3), NOW(3)),
(UUID(), @regular_user_id, 'VIEW_TOKENS', 'tokens', NOW(3), NOW(3)),
(UUID(), @regular_user_id, 'ACCESS_API_DOCS', 'api', NOW(3), NOW(3));

-- Insert Software entries
INSERT INTO `Software` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES
(UUID(), 'WebApp Manager Pro', 'Professional web application management tool with advanced features', NOW(3), NOW(3)),
(UUID(), 'API Gateway Enterprise', 'Enterprise-grade API gateway solution', NOW(3), NOW(3)),
(UUID(), 'Data Sync Platform', 'Real-time data synchronization platform', NOW(3), NOW(3));

-- Get Software IDs
SET @software1_id = (SELECT `id` FROM `Software` WHERE `name` = 'WebApp Manager Pro' LIMIT 1);
SET @software2_id = (SELECT `id` FROM `Software` WHERE `name` = 'API Gateway Enterprise' LIMIT 1);
SET @software3_id = (SELECT `id` FROM `Software` WHERE `name` = 'Data Sync Platform' LIMIT 1);

-- Insert Versions
INSERT INTO `Version` (`id`, `softwareId`, `version`, `releaseDate`, `changelog`, `createdAt`, `updatedAt`) VALUES
(UUID(), @software1_id, '1.0.0', '2024-01-15 00:00:00.000', 'Initial release with core features', NOW(3), NOW(3)),
(UUID(), @software1_id, '1.1.0', '2024-03-20 00:00:00.000', 'Added user management and improved performance', NOW(3), NOW(3)),
(UUID(), @software1_id, '2.0.0', '2024-06-10 00:00:00.000', 'Major update with blockchain integration and new API endpoints', NOW(3), NOW(3)),
(UUID(), @software2_id, '3.5.2', '2024-02-10 00:00:00.000', 'Stable release with security patches', NOW(3), NOW(3)),
(UUID(), @software2_id, '4.0.0', '2024-05-01 00:00:00.000', 'Complete rewrite with improved performance', NOW(3), NOW(3)),
(UUID(), @software3_id, '2.3.1', '2024-04-15 00:00:00.000', 'Bug fixes and minor improvements', NOW(3), NOW(3));

-- Get Version IDs
SET @version1_1_id = (SELECT `id` FROM `Version` WHERE `softwareId` = @software1_id AND `version` = '1.0.0' LIMIT 1);
SET @version1_2_id = (SELECT `id` FROM `Version` WHERE `softwareId` = @software1_id AND `version` = '1.1.0' LIMIT 1);
SET @version1_3_id = (SELECT `id` FROM `Version` WHERE `softwareId` = @software1_id AND `version` = '2.0.0' LIMIT 1);
SET @version2_1_id = (SELECT `id` FROM `Version` WHERE `softwareId` = @software2_id AND `version` = '3.5.2' LIMIT 1);
SET @version2_2_id = (SELECT `id` FROM `Version` WHERE `softwareId` = @software2_id AND `version` = '4.0.0' LIMIT 1);
SET @version3_1_id = (SELECT `id` FROM `Version` WHERE `softwareId` = @software3_id AND `version` = '2.3.1' LIMIT 1);

-- Insert AccessTokens (with JSON permissions)
INSERT INTO `AccessToken` (`id`, `token`, `softwareId`, `versionId`, `expiresAt`, `permissions`, `status`, `owner`, `blockchainTxHash`, `createdAt`, `updatedAt`) VALUES
(UUID(), CONCAT('token_', SUBSTRING(MD5(RAND()), 1, 15), '_', UNIX_TIMESTAMP(NOW(3))), @software1_id, @version1_3_id, DATE_ADD(NOW(3), INTERVAL 90 DAY), '["READ", "WRITE", "SYNC"]', 'ACTIVE', 'user@example.com', CONCAT('0x', SUBSTRING(MD5(RAND()), 1, 64)), NOW(3), NOW(3)),
(UUID(), CONCAT('token_', SUBSTRING(MD5(RAND()), 1, 15), '_', UNIX_TIMESTAMP(NOW(3))), @software1_id, @version1_2_id, DATE_ADD(NOW(3), INTERVAL 30 DAY), '["READ"]', 'ACTIVE', 'admin@example.com', NULL, NOW(3), NOW(3)),
(UUID(), CONCAT('token_', SUBSTRING(MD5(RAND()), 1, 15), '_', UNIX_TIMESTAMP(NOW(3))), @software2_id, @version2_2_id, DATE_ADD(NOW(3), INTERVAL 365 DAY), '["READ", "WRITE", "EXCHANGE", "EXTEND"]', 'ACTIVE', 'enterprise@example.com', CONCAT('0x', SUBSTRING(MD5(RAND()), 1, 64)), NOW(3), NOW(3)),
(UUID(), CONCAT('token_', SUBSTRING(MD5(RAND()), 1, 15), '_', UNIX_TIMESTAMP(NOW(3))), @software2_id, @version2_1_id, DATE_SUB(NOW(3), INTERVAL 10 DAY), '["READ"]', 'EXPIRED', 'tester@example.com', NULL, NOW(3), NOW(3)),
(UUID(), CONCAT('token_', SUBSTRING(MD5(RAND()), 1, 15), '_', UNIX_TIMESTAMP(NOW(3))), @software3_id, @version3_1_id, DATE_ADD(NOW(3), INTERVAL 60 DAY), '["READ", "SYNC"]', 'ACTIVE', 'sync-user@example.com', NULL, NOW(3), NOW(3)),
(UUID(), CONCAT('token_', SUBSTRING(MD5(RAND()), 1, 15), '_', UNIX_TIMESTAMP(NOW(3))), @software1_id, NULL, DATE_ADD(NOW(3), INTERVAL 180 DAY), '["READ", "WRITE"]', 'REVOKED', 'old-user@example.com', CONCAT('0x', SUBSTRING(MD5(RAND()), 1, 64)), NOW(3), NOW(3));

-- Get Token IDs for AuditLogs
SET @token1_id = (SELECT `id` FROM `AccessToken` WHERE `owner` = 'user@example.com' AND `status` = 'ACTIVE' LIMIT 1);
SET @token2_id = (SELECT `id` FROM `AccessToken` WHERE `owner` = 'admin@example.com' LIMIT 1);
SET @token3_id = (SELECT `id` FROM `AccessToken` WHERE `owner` = 'enterprise@example.com' LIMIT 1);
SET @token4_id = (SELECT `id` FROM `AccessToken` WHERE `owner` = 'tester@example.com' LIMIT 1);
SET @token6_id = (SELECT `id` FROM `AccessToken` WHERE `owner` = 'old-user@example.com' LIMIT 1);

-- Insert AuditLogs
INSERT INTO `AuditLog` (`id`, `tokenId`, `action`, `timestamp`, `ipAddress`, `userAgent`, `blockchainTxHash`) VALUES
(UUID(), @token1_id, 'CREATE', NOW(3), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', CONCAT('0x', SUBSTRING(MD5(RAND()), 1, 64))),
(UUID(), @token1_id, 'VALIDATE', NOW(3), '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NULL),
(UUID(), @token2_id, 'CREATE', NOW(3), '10.0.0.50', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', NULL),
(UUID(), @token3_id, 'CREATE', NOW(3), '172.16.0.1', 'curl/7.68.0', CONCAT('0x', SUBSTRING(MD5(RAND()), 1, 64))),
(UUID(), @token3_id, 'EXTEND', NOW(3), '172.16.0.1', 'PostmanRuntime/7.32.0', CONCAT('0x', SUBSTRING(MD5(RAND()), 1, 64))),
(UUID(), @token4_id, 'VALIDATE', NOW(3), '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NULL),
(UUID(), @token6_id, 'REVOKE', NOW(3), '10.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', CONCAT('0x', SUBSTRING(MD5(RAND()), 1, 64))),
(UUID(), @token1_id, 'EXCHANGE', NOW(3), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', CONCAT('0x', SUBSTRING(MD5(RAND()), 1, 64)));

-- ============================================
-- END OF SCRIPT
-- ============================================
