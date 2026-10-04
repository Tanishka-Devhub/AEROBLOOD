-- MySQL dump 10.13  Distrib 8.4.11, for Win64 (x86_64)
--
-- Host: localhost    Database: aero_blood
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `aero_blood_date_status_backup`
--

DROP TABLE IF EXISTS `aero_blood_date_status_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aero_blood_date_status_backup` (
  `donation_id` int NOT NULL DEFAULT '0',
  `donation_date` date NOT NULL,
  `unit_id` int NOT NULL DEFAULT '0',
  `collection_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `bloodunit_status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `allocation`
--

DROP TABLE IF EXISTS `allocation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allocation` (
  `allocation_id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `unit_id` int NOT NULL,
  `source_blood_bank_id` int NOT NULL,
  `allocated_by_staff_id` int NOT NULL,
  `allocated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`allocation_id`),
  KEY `request_id` (`request_id`),
  KEY `unit_id` (`unit_id`),
  KEY `source_blood_bank_id` (`source_blood_bank_id`),
  KEY `allocated_by_staff_id` (`allocated_by_staff_id`),
  CONSTRAINT `allocation_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `bloodrequest` (`request_id`),
  CONSTRAINT `allocation_ibfk_2` FOREIGN KEY (`unit_id`) REFERENCES `bloodunit` (`unit_id`),
  CONSTRAINT `allocation_ibfk_3` FOREIGN KEY (`source_blood_bank_id`) REFERENCES `bloodbank` (`blood_bank_id`),
  CONSTRAINT `allocation_ibfk_4` FOREIGN KEY (`allocated_by_staff_id`) REFERENCES `hospitalstaff` (`staff_id`),
  CONSTRAINT `allocation_chk_1` CHECK ((`status` in (_utf8mb4'RESERVED',_utf8mb4'ALLOCATED',_utf8mb4'ISSUED',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB AUTO_INCREMENT=507 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bloodbank`
--

DROP TABLE IF EXISTS `bloodbank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloodbank` (
  `blood_bank_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`blood_bank_id`),
  CONSTRAINT `bloodbank_chk_1` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE')))
) ENGINE=InnoDB AUTO_INCREMENT=4096 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bloodcompatibility`
--

DROP TABLE IF EXISTS `bloodcompatibility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloodcompatibility` (
  `compatibility_id` int NOT NULL AUTO_INCREMENT,
  `donor_blood_group_id` int NOT NULL,
  `recipient_blood_group_id` int NOT NULL,
  `is_compatible` tinyint(1) NOT NULL,
  PRIMARY KEY (`compatibility_id`),
  UNIQUE KEY `donor_blood_group_id` (`donor_blood_group_id`,`recipient_blood_group_id`),
  KEY `recipient_blood_group_id` (`recipient_blood_group_id`),
  CONSTRAINT `bloodcompatibility_ibfk_1` FOREIGN KEY (`donor_blood_group_id`) REFERENCES `bloodgroup` (`blood_group_id`),
  CONSTRAINT `bloodcompatibility_ibfk_2` FOREIGN KEY (`recipient_blood_group_id`) REFERENCES `bloodgroup` (`blood_group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bloodgroup`
--

DROP TABLE IF EXISTS `bloodgroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloodgroup` (
  `blood_group_id` int NOT NULL AUTO_INCREMENT,
  `group_name` varchar(3) NOT NULL,
  PRIMARY KEY (`blood_group_id`),
  UNIQUE KEY `group_name` (`group_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bloodrequest`
--

DROP TABLE IF EXISTS `bloodrequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloodrequest` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `hospital_id` int NOT NULL,
  `patient_reference` varchar(50) NOT NULL,
  `blood_group_id` int NOT NULL,
  `quantity_required` int NOT NULL,
  `requested_by_staff_id` int NOT NULL,
  `attending_doctor_id` int NOT NULL,
  `doctor_approval_status` varchar(20) NOT NULL,
  `doctor_approved_at` datetime DEFAULT NULL,
  `request_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `required_by` datetime NOT NULL,
  `priority` varchar(20) NOT NULL,
  `status` varchar(30) NOT NULL,
  PRIMARY KEY (`request_id`),
  KEY `hospital_id` (`hospital_id`),
  KEY `blood_group_id` (`blood_group_id`),
  KEY `requested_by_staff_id` (`requested_by_staff_id`),
  KEY `attending_doctor_id` (`attending_doctor_id`),
  CONSTRAINT `bloodrequest_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospital` (`hospital_id`),
  CONSTRAINT `bloodrequest_ibfk_2` FOREIGN KEY (`blood_group_id`) REFERENCES `bloodgroup` (`blood_group_id`),
  CONSTRAINT `bloodrequest_ibfk_3` FOREIGN KEY (`requested_by_staff_id`) REFERENCES `hospitalstaff` (`staff_id`),
  CONSTRAINT `bloodrequest_ibfk_4` FOREIGN KEY (`attending_doctor_id`) REFERENCES `hospitalstaff` (`staff_id`),
  CONSTRAINT `bloodrequest_chk_1` CHECK ((`quantity_required` > 0)),
  CONSTRAINT `bloodrequest_chk_2` CHECK ((`doctor_approval_status` in (_utf8mb4'PENDING',_utf8mb4'APPROVED',_utf8mb4'REJECTED'))),
  CONSTRAINT `bloodrequest_chk_3` CHECK ((`priority` in (_utf8mb4'NORMAL',_utf8mb4'URGENT',_utf8mb4'EMERGENCY'))),
  CONSTRAINT `bloodrequest_chk_4` CHECK ((`status` in (_utf8mb4'PENDING',_utf8mb4'PARTIALLY_ALLOCATED',_utf8mb4'FULFILLED',_utf8mb4'CANCELLED',_utf8mb4'EXPIRED')))
) ENGINE=InnoDB AUTO_INCREMENT=168 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bloodrequest_staging`
--

DROP TABLE IF EXISTS `bloodrequest_staging`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloodrequest_staging` (
  `hospital_id` int NOT NULL,
  `patient_reference` varchar(50) NOT NULL,
  `blood_group` varchar(3) NOT NULL,
  `quantity_required` int NOT NULL,
  `requested_by_employee_id` varchar(50) NOT NULL,
  `attending_doctor_employee_id` varchar(50) NOT NULL,
  `doctor_approval_status` varchar(20) NOT NULL,
  `doctor_approved_at` datetime DEFAULT NULL,
  `request_date` datetime NOT NULL,
  `required_by` datetime NOT NULL,
  `priority` varchar(20) NOT NULL,
  `status` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bloodtransfer`
--

DROP TABLE IF EXISTS `bloodtransfer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloodtransfer` (
  `transfer_id` int NOT NULL AUTO_INCREMENT,
  `unit_id` int NOT NULL,
  `source_blood_bank_id` int NOT NULL,
  `destination_blood_bank_id` int NOT NULL,
  `transfer_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` varchar(255) NOT NULL,
  `approved_by_staff_id` int DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`transfer_id`),
  KEY `unit_id` (`unit_id`),
  KEY `source_blood_bank_id` (`source_blood_bank_id`),
  KEY `destination_blood_bank_id` (`destination_blood_bank_id`),
  KEY `approved_by_staff_id` (`approved_by_staff_id`),
  CONSTRAINT `bloodtransfer_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `bloodunit` (`unit_id`),
  CONSTRAINT `bloodtransfer_ibfk_2` FOREIGN KEY (`source_blood_bank_id`) REFERENCES `bloodbank` (`blood_bank_id`),
  CONSTRAINT `bloodtransfer_ibfk_3` FOREIGN KEY (`destination_blood_bank_id`) REFERENCES `bloodbank` (`blood_bank_id`),
  CONSTRAINT `bloodtransfer_ibfk_4` FOREIGN KEY (`approved_by_staff_id`) REFERENCES `hospitalstaff` (`staff_id`),
  CONSTRAINT `bloodtransfer_chk_1` CHECK ((`source_blood_bank_id` <> `destination_blood_bank_id`)),
  CONSTRAINT `bloodtransfer_chk_2` CHECK ((`status` in (_utf8mb4'REQUESTED',_utf8mb4'APPROVED',_utf8mb4'IN_TRANSIT',_utf8mb4'COMPLETED',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bloodunit`
--

DROP TABLE IF EXISTS `bloodunit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloodunit` (
  `unit_id` int NOT NULL AUTO_INCREMENT,
  `donation_id` int NOT NULL,
  `blood_bank_id` int NOT NULL,
  `collection_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`unit_id`),
  KEY `donation_id` (`donation_id`),
  KEY `blood_bank_id` (`blood_bank_id`),
  CONSTRAINT `bloodunit_ibfk_1` FOREIGN KEY (`donation_id`) REFERENCES `donation` (`donation_id`),
  CONSTRAINT `bloodunit_ibfk_2` FOREIGN KEY (`blood_bank_id`) REFERENCES `bloodbank` (`blood_bank_id`),
  CONSTRAINT `bloodunit_chk_1` CHECK ((`status` in (_utf8mb4'AVAILABLE',_utf8mb4'RESERVED',_utf8mb4'ALLOCATED',_utf8mb4'USED',_utf8mb4'EXPIRED',_utf8mb4'DISCARDED')))
) ENGINE=InnoDB AUTO_INCREMENT=251283 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bloodunit_staging`
--

DROP TABLE IF EXISTS `bloodunit_staging`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloodunit_staging` (
  `donation_id` int NOT NULL,
  `blood_bank_id` int NOT NULL,
  `collection_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `doctor_source`
--

DROP TABLE IF EXISTS `doctor_source`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_source` (
  `doctor_id` varchar(50) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `specialization` varchar(150) DEFAULT NULL,
  `qualification` varchar(150) DEFAULT NULL,
  `experience_years` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `donation`
--

DROP TABLE IF EXISTS `donation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donation` (
  `donation_id` int NOT NULL AUTO_INCREMENT,
  `donor_id` int NOT NULL,
  `blood_bank_id` int NOT NULL,
  `blood_group_id` int NOT NULL,
  `donation_date` date NOT NULL,
  `eligibility_status` varchar(20) NOT NULL,
  `screening_status` varchar(20) NOT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`donation_id`),
  KEY `donor_id` (`donor_id`),
  KEY `blood_bank_id` (`blood_bank_id`),
  KEY `blood_group_id` (`blood_group_id`),
  CONSTRAINT `donation_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donor` (`donor_id`),
  CONSTRAINT `donation_ibfk_2` FOREIGN KEY (`blood_bank_id`) REFERENCES `bloodbank` (`blood_bank_id`),
  CONSTRAINT `donation_ibfk_3` FOREIGN KEY (`blood_group_id`) REFERENCES `bloodgroup` (`blood_group_id`),
  CONSTRAINT `donation_chk_1` CHECK ((`eligibility_status` in (_utf8mb4'ELIGIBLE',_utf8mb4'INELIGIBLE'))),
  CONSTRAINT `donation_chk_2` CHECK ((`screening_status` in (_utf8mb4'PENDING',_utf8mb4'PASSED',_utf8mb4'FAILED')))
) ENGINE=InnoDB AUTO_INCREMENT=251283 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `donation_staging`
--

DROP TABLE IF EXISTS `donation_staging`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donation_staging` (
  `donor_email` varchar(150) NOT NULL,
  `blood_group` varchar(3) NOT NULL,
  `blood_bank_id` int NOT NULL,
  `donation_date` date NOT NULL,
  `eligibility_status` varchar(20) NOT NULL,
  `screening_status` varchar(20) NOT NULL,
  `remarks` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `donor`
--

DROP TABLE IF EXISTS `donor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donor` (
  `donor_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `date_of_birth` date NOT NULL,
  `gender` varchar(20) NOT NULL,
  `blood_group_id` int NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `registration_date` date NOT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`donor_id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `email` (`email`),
  KEY `blood_group_id` (`blood_group_id`),
  CONSTRAINT `donor_ibfk_1` FOREIGN KEY (`blood_group_id`) REFERENCES `bloodgroup` (`blood_group_id`),
  CONSTRAINT `donor_chk_1` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE',_utf8mb4'SUSPENDED')))
) ENGINE=InnoDB AUTO_INCREMENT=10001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `donor_staging`
--

DROP TABLE IF EXISTS `donor_staging`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `donor_staging` (
  `full_name` varchar(150) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `blood_group` varchar(3) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `registration_date` date DEFAULT NULL,
  `availability` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_source`
--

DROP TABLE IF EXISTS `employee_source`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_source` (
  `employee_id` varchar(50) NOT NULL,
  `employee_name` varchar(150) NOT NULL,
  `gender` varchar(20) NOT NULL,
  `role` varchar(30) NOT NULL,
  `employment_type` varchar(30) NOT NULL,
  `date_of_joining` date NOT NULL,
  `department_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hospital`
--

DROP TABLE IF EXISTS `hospital`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospital` (
  `hospital_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`hospital_id`),
  UNIQUE KEY `phone` (`phone`),
  CONSTRAINT `hospital_chk_1` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE')))
) ENGINE=InnoDB AUTO_INCREMENT=1349 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hospital_staging`
--

DROP TABLE IF EXISTS `hospital_staging`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospital_staging` (
  `hospital_name` varchar(150) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `local_address` varchar(255) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hospitalstaff`
--

DROP TABLE IF EXISTS `hospitalstaff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospitalstaff` (
  `staff_id` int NOT NULL AUTO_INCREMENT,
  `hospital_id` int NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `role` varchar(30) NOT NULL,
  `license_or_employee_id` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `license_or_employee_id` (`license_or_employee_id`),
  UNIQUE KEY `email` (`email`),
  KEY `hospital_id` (`hospital_id`),
  CONSTRAINT `hospitalstaff_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospital` (`hospital_id`),
  CONSTRAINT `hospitalstaff_chk_1` CHECK ((`role` in (_utf8mb4'DOCTOR',_utf8mb4'NURSE',_utf8mb4'COORDINATOR',_utf8mb4'LAB_STAFF',_utf8mb4'BLOOD_BANK_STAFF',_utf8mb4'ADMIN'))),
  CONSTRAINT `hospitalstaff_chk_2` CHECK ((`status` in (_utf8mb4'ACTIVE',_utf8mb4'INACTIVE',_utf8mb4'SUSPENDED')))
) ENGINE=InnoDB AUTO_INCREMENT=501 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hospitalstaff_staging`
--

DROP TABLE IF EXISTS `hospitalstaff_staging`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospitalstaff_staging` (
  `employee_id` varchar(50) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `gender` varchar(20) NOT NULL,
  `source_role` varchar(30) NOT NULL,
  `employment_type` varchar(30) NOT NULL,
  `date_of_joining` date NOT NULL,
  `department_id` int NOT NULL,
  `doctor_id` varchar(50) DEFAULT NULL,
  `specialization` varchar(150) DEFAULT NULL,
  `qualification` varchar(150) DEFAULT NULL,
  `experience_years` int DEFAULT NULL,
  `hospital_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-04 12:53:29
