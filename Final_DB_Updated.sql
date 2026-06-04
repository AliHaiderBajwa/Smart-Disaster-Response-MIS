--Author : Muhammad Abdul Wadood
-- Person 2 :
SET NOCOUNT ON;
GO

-- =====================================================
-- 1. DROP PROBLEMATIC TRIGGER IF EXISTS (to avoid double deduction)
-- =====================================================
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_UpdateStockAfterAllocation')
    DROP TRIGGER trg_UpdateStockAfterAllocation;
GO

-- =====================================================
-- 2. CREATE BASE TABLES (if not exist)
-- =====================================================

-- Roles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE Roles (
        RoleID INT PRIMARY KEY IDENTITY(1,1),
        RoleName VARCHAR(50) NOT NULL
            CHECK (RoleName IN (
                'Administrator', 'Emergency Operator', 'Field Officer',
                'Warehouse Manager', 'Finance Officer'
            )),
        Description VARCHAR(255)
    );
END
GO

-- Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        UserID INT PRIMARY KEY IDENTITY(1,1),
        FullName VARCHAR(100) NOT NULL,
        Email VARCHAR(100) UNIQUE NOT NULL,
        PasswordHash VARCHAR(255) NOT NULL,
        RoleID INT NOT NULL,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
    );
END
GO

-- EmergencyReport
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmergencyReport')
BEGIN
    CREATE TABLE EmergencyReport (
        ReportID INT PRIMARY KEY IDENTITY(1,1),
        Location VARCHAR(255) NOT NULL,
        DisasterType VARCHAR(50)
            CHECK (DisasterType IN ('Flood','Earthquake','Fire','Heatwave','Cyclone','Landslide','Avalanche')),
        SeverityLevel VARCHAR(20) CHECK (SeverityLevel IN ('Low','Medium','High','Critical')),
        Description TEXT,
        Status VARCHAR(20) CHECK (Status IN ('Open','InProgress','Resolved')),
        ReportedAt DATETIME DEFAULT GETDATE(),
        ReportedByUserID INT,
        FOREIGN KEY (ReportedByUserID) REFERENCES Users(UserID)
    );
END
GO

-- RescueTeam
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RescueTeam')
BEGIN
    CREATE TABLE RescueTeam (
        TeamID INT PRIMARY KEY IDENTITY(1,1),
        TeamName VARCHAR(100),
        TeamType VARCHAR(20) CHECK (TeamType IN ('Medical','Fire','Rescue')),
        CurrentLocation VARCHAR(255),
        Status VARCHAR(20) CHECK (Status IN ('Available','Assigned','Busy','Completed'))
    );
END
GO

-- TeamAssignment
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TeamAssignment')
BEGIN
    CREATE TABLE TeamAssignment (
        AssignmentID INT PRIMARY KEY IDENTITY(1,1),
        ReportID INT,
        TeamID INT,
        AssignedAt DATETIME DEFAULT GETDATE(),
        CompletedAt DATETIME,
        Status VARCHAR(20) CHECK (Status IN ('Assigned','InProgress','Completed')),
        FOREIGN KEY (ReportID) REFERENCES EmergencyReport(ReportID),
        FOREIGN KEY (TeamID) REFERENCES RescueTeam(TeamID)
    );
END
GO

-- TeamStatusHistory
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TeamStatusHistory')
BEGIN
    CREATE TABLE TeamStatusHistory (
        HistoryID INT PRIMARY KEY IDENTITY(1,1),
        TeamID INT,
        Status VARCHAR(20) CHECK (Status IN ('Available','Assigned','Busy','Completed')),
        Timestamp DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (TeamID) REFERENCES RescueTeam(TeamID)
    );
END
GO

-- Warehouse
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Warehouse')
BEGIN
    CREATE TABLE Warehouse (
        WarehouseID INT PRIMARY KEY IDENTITY(1,1),
        Name VARCHAR(100),
        Location VARCHAR(255),
        ManagerUserID INT,
        FOREIGN KEY (ManagerUserID) REFERENCES Users(UserID)
    );
END
GO

-- Resource
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Resource')
BEGIN
    CREATE TABLE Resource (
        ResourceID INT PRIMARY KEY IDENTITY(1,1),
        ResourceType VARCHAR(50) CHECK (ResourceType IN ('Food','Water','Medicine','Shelter','Blankets')),
        AvailableQuantity INT CHECK (AvailableQuantity >= 0),
        Unit VARCHAR(30),
        ThresholdLevel INT,
        WarehouseID INT,
        FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID)
    );
END
GO

-- ResourceAllocation
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ResourceAllocation')
BEGIN
    CREATE TABLE ResourceAllocation (
        AllocationID INT PRIMARY KEY IDENTITY(1,1),
        ResourceID INT,
        ReportID INT,
        ApprovedByUserID INT,
        QuantityAllocated INT CHECK (QuantityAllocated > 0),
        Status VARCHAR(20) CHECK (Status IN ('Pending','Approved','Dispatched','Consumed')),
        AllocatedAt DATETIME DEFAULT GETDATE(),
        TotalConsumed INT DEFAULT 0,
        FOREIGN KEY (ResourceID) REFERENCES Resource(ResourceID),
        FOREIGN KEY (ReportID) REFERENCES EmergencyReport(ReportID),
        FOREIGN KEY (ApprovedByUserID) REFERENCES Users(UserID)
    );
END
GO

-- Hospital
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Hospital')
BEGIN
    CREATE TABLE Hospital (
        HospitalID INT PRIMARY KEY IDENTITY(1,1),
        Name VARCHAR(100),
        Location VARCHAR(255),
        TotalBeds INT,
        AvailableBeds INT
    );
END
GO

-- Patient
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Patient')
BEGIN
    CREATE TABLE Patient (
        PatientID INT PRIMARY KEY IDENTITY(1,1),
        FullName VARCHAR(100),
        Age INT,
        Condition VARCHAR(20) CHECK (Condition IN ('Stable','Critical','Deceased')),
        Status VARCHAR(20),
        AdmittedAt DATETIME DEFAULT GETDATE(),
        HospitalID INT,
        ReportID INT,
        FOREIGN KEY (HospitalID) REFERENCES Hospital(HospitalID),
        FOREIGN KEY (ReportID) REFERENCES EmergencyReport(ReportID)
    );
END
GO

-- FinancialTransaction
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FinancialTransaction')
BEGIN
    CREATE TABLE FinancialTransaction (
        TransactionID INT PRIMARY KEY IDENTITY(1,1),
        Type VARCHAR(20) CHECK (Type IN ('Donation','Expense','Procurement')),
        Amount DECIMAL(12,2),
        Description TEXT,
        Timestamp DATETIME DEFAULT GETDATE(),
        ReportID INT,
        UserID INT,
        DisasterEventID INT NULL,
        BudgetID INT NULL,
        FOREIGN KEY (ReportID) REFERENCES EmergencyReport(ReportID),
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
    );
END
GO

-- Approval
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Approval')
BEGIN
    CREATE TABLE Approval (
        ApprovalID INT PRIMARY KEY IDENTITY(1,1),
        RequestType VARCHAR(50) CHECK (RequestType IN ('ResourceAllocation','TeamDeployment','Financial')),
        ReferenceType VARCHAR(50) CHECK (ReferenceType IN ('ResourceAllocation','TeamAssignment','FinancialTransaction')),
        ReferenceID INT,
        Status VARCHAR(20) CHECK (Status IN ('Pending','Approved','Rejected')),
        RequestedAt DATETIME DEFAULT GETDATE(),
        DecidedAt DATETIME,
        Remarks TEXT,
        RequestedByUserID INT,
        ApprovedByUserID INT,
        FOREIGN KEY (RequestedByUserID) REFERENCES Users(UserID),
        FOREIGN KEY (ApprovedByUserID) REFERENCES Users(UserID)
    );
END
GO

-- AuditLog
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog')
BEGIN
    CREATE TABLE AuditLog (
        LogID INT PRIMARY KEY IDENTITY(1,1),
        UserID INT,
        ActionType VARCHAR(20),
        TableAffected VARCHAR(50),
        RecordID INT,
        OldValue TEXT,
        NewValue TEXT,
        Timestamp DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
    );
END
GO

-- =====================================================
-- 3. ADD MISSING TABLES (RBAC, Budget, Alerts, Escalation)
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Permission')
BEGIN
    CREATE TABLE Permission (
        PermissionID INT PRIMARY KEY IDENTITY(1,1),
        PermissionName VARCHAR(100) UNIQUE NOT NULL,
        Description VARCHAR(255)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermission')
BEGIN
    CREATE TABLE RolePermission (
        RoleID INT,
        PermissionID INT,
        PRIMARY KEY (RoleID, PermissionID),
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),
        FOREIGN KEY (PermissionID) REFERENCES Permission(PermissionID)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BudgetTracking')
BEGIN
    CREATE TABLE BudgetTracking (
        BudgetID INT PRIMARY KEY IDENTITY(1,1),
        DisasterType VARCHAR(50),
        FiscalYear INT,
        AllocatedAmount DECIMAL(12,2),
        SpentAmount DECIMAL(12,2) DEFAULT 0,
        RemainingAmount AS (AllocatedAmount - SpentAmount) PERSISTED,
        CONSTRAINT CHK_Budget_Remaining CHECK (SpentAmount <= AllocatedAmount)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LowStockAlert')
BEGIN
    CREATE TABLE LowStockAlert (
        AlertID INT PRIMARY KEY IDENTITY(1,1),
        ResourceID INT,
        AlertTime DATETIME DEFAULT GETDATE(),
        Message VARCHAR(255),
        Status VARCHAR(20) DEFAULT 'New',
        FOREIGN KEY (ResourceID) REFERENCES Resource(ResourceID)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmergencyEscalation')
BEGIN
    CREATE TABLE EmergencyEscalation (
        EscalationID INT PRIMARY KEY IDENTITY(1,1),
        ReportID INT,
        PatientName VARCHAR(100),
        RequiredBeds INT,
        EscalatedAt DATETIME DEFAULT GETDATE(),
        Resolved BIT DEFAULT 0,
        FOREIGN KEY (ReportID) REFERENCES EmergencyReport(ReportID)
    );
END
GO

-- Add missing columns if not present (in case tables already exist from prior run)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'TotalConsumed' AND object_id = OBJECT_ID('ResourceAllocation'))
    ALTER TABLE ResourceAllocation ADD TotalConsumed INT DEFAULT 0;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'DisasterEventID' AND object_id = OBJECT_ID('FinancialTransaction'))
    ALTER TABLE FinancialTransaction ADD DisasterEventID INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'BudgetID' AND object_id = OBJECT_ID('FinancialTransaction'))
    ALTER TABLE FinancialTransaction ADD BudgetID INT NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_FinancialTransaction_BudgetTracking')
    ALTER TABLE FinancialTransaction ADD FOREIGN KEY (BudgetID) REFERENCES BudgetTracking(BudgetID);
GO

-- =====================================================
-- 4. INSERT INITIAL DATA (Roles, Users, etc.)
-- =====================================================
SET IDENTITY_INSERT Roles ON;
INSERT INTO Roles (RoleID, RoleName, Description)
SELECT * FROM (VALUES
    (1, 'Administrator', 'Full system access'),
    (2, 'Emergency Operator', 'Handles emergency reports'),
    (3, 'Field Officer', 'Manages rescue operations'),
    (4, 'Warehouse Manager', 'Handles resources'),
    (5, 'Finance Officer', 'Manages financial transactions')
) AS v(RoleID, RoleName, Description)
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE RoleID = v.RoleID);
SET IDENTITY_INSERT Roles OFF;
GO

SET IDENTITY_INSERT Users ON;
INSERT INTO Users (UserID, FullName, Email, PasswordHash, RoleID)
SELECT * FROM (VALUES
    (1, 'Sultan Suleiman', 'suleiman@mis.pk', '$2b$10$3ViTlOlrcOGVcTiQjswcUeLkxLQnbz5kkHHeK70Po8M8B6h/XHsR6', 1),
    (2, 'Salahuddin Ayyubi', 'salahuddin@mis.pk', '$2b$10$gJcuFxavdtfYuAKdBX78/e4MkLO2nWmKFQ7OCWeV6NSThdzv6GTFi', 2),
    (3, 'Nuruddin Zangi', 'nuruddin@mis.pk', '$2b$10$Db7SMsVS98mFC5tyERXXZO3C4WzqsCky6slEawjHDc5/NkTMbI7BG', 3),
    (4, 'Tipu Sultan', 'tipu@mis.pk', '$2b$10$jsrWEHmW.kqKSkYt8eYPleculJETYbcFrpU9wmzXkR7hgsM4AXBRi', 3),
    (5, 'Shah Jahan', 'shahjahan@mis.pk', '$2b$10$SVTaBRGpL64gNH6GsueVkudfb6fpG5ol2ECD8ayEoZ3cDXNf5tNF6', 4),
    (6, 'Aurangzeb Alamgir', 'aurangzeb@mis.pk', '$2b$10$7Vbj7rinUgqvWDaGOT4tWOz6EynMcUiJ2MwtgwFQVg302iP94QhYC', 4),
    (7, 'Muhammad Ali Jinnah', 'jinnah@mis.pk', '$2b$10$TDEdiAF0i/mFbV.XmJ3zYOXAw8M4A7GMkHxFCI7N3K3rntVws4S0W', 1),
    (8, 'Allama Iqbal', 'iqbal@mis.pk', '$2b$10$D1AAQ0MLPrfZezMTWZm76eEoEayr.CrEJbiFiZbuHYIdcyRgzmlpi', 2),
    (9, 'Abdul Hamid II', 'hamid@mis.pk', '$2b$10$Gin6JOBsGPtrHdL0ffXlgeDtOvY5v8Mr2pRtCVwsdnbLVgGshksCm', 5),
    (10, 'Faisal bin Abdulaziz', 'faisal@mis.pk', '$2b$10$Dx7WdZ/U8kpOY8jWDomwzurdWLKQJ5ZI.oRJVWKFLoVx3ItZy3.Ea', 5)
) AS v(UserID, FullName, Email, PasswordHash, RoleID)
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE UserID = v.UserID);
SET IDENTITY_INSERT Users OFF;
GO

-- Upgrade older demo installs that still have plain text passwords.
UPDATE Users SET PasswordHash = CASE UserID
    WHEN 1 THEN '$2b$10$3ViTlOlrcOGVcTiQjswcUeLkxLQnbz5kkHHeK70Po8M8B6h/XHsR6'
    WHEN 2 THEN '$2b$10$gJcuFxavdtfYuAKdBX78/e4MkLO2nWmKFQ7OCWeV6NSThdzv6GTFi'
    WHEN 3 THEN '$2b$10$Db7SMsVS98mFC5tyERXXZO3C4WzqsCky6slEawjHDc5/NkTMbI7BG'
    WHEN 4 THEN '$2b$10$jsrWEHmW.kqKSkYt8eYPleculJETYbcFrpU9wmzXkR7hgsM4AXBRi'
    WHEN 5 THEN '$2b$10$SVTaBRGpL64gNH6GsueVkudfb6fpG5ol2ECD8ayEoZ3cDXNf5tNF6'
    WHEN 6 THEN '$2b$10$7Vbj7rinUgqvWDaGOT4tWOz6EynMcUiJ2MwtgwFQVg302iP94QhYC'
    WHEN 7 THEN '$2b$10$TDEdiAF0i/mFbV.XmJ3zYOXAw8M4A7GMkHxFCI7N3K3rntVws4S0W'
    WHEN 8 THEN '$2b$10$D1AAQ0MLPrfZezMTWZm76eEoEayr.CrEJbiFiZbuHYIdcyRgzmlpi'
    WHEN 9 THEN '$2b$10$Gin6JOBsGPtrHdL0ffXlgeDtOvY5v8Mr2pRtCVwsdnbLVgGshksCm'
    WHEN 10 THEN '$2b$10$Dx7WdZ/U8kpOY8jWDomwzurdWLKQJ5ZI.oRJVWKFLoVx3ItZy3.Ea'
END
WHERE PasswordHash LIKE 'hash%';
GO

-- Sample data (only if tables are empty)
IF NOT EXISTS (SELECT 1 FROM EmergencyReport)
BEGIN
    INSERT INTO EmergencyReport (Location, DisasterType, SeverityLevel, Description, Status, ReportedByUserID)
    VALUES
    ('Lahore', 'Flood', 'High', 'River overflow', 'Open', 2),
    ('Karachi', 'Fire', 'Medium', 'Warehouse fire', 'InProgress', 2),
    ('Islamabad', 'Earthquake', 'Critical', 'Severe tremors', 'Open', 8),
    ('Peshawar', 'Flood', 'High', 'Water entering homes', 'Open', 2),
    ('Quetta', 'Earthquake', 'Critical', 'Buildings collapsed', 'InProgress', 8);
END
GO

IF NOT EXISTS (SELECT 1 FROM RescueTeam)
BEGIN
    INSERT INTO RescueTeam (TeamName, TeamType, CurrentLocation, Status)
    VALUES
    ('Al-Fateh Unit', 'Rescue', 'Lahore', 'Available'),
    ('Zulfiqar Squad', 'Fire', 'Karachi', 'Busy'),
    ('Ansar Brigade', 'Medical', 'Islamabad', 'Available'),
    ('Ghazi Unit', 'Rescue', 'Peshawar', 'Assigned'),
    ('Hilal Team', 'Medical', 'Quetta', 'Available');
END
GO

IF NOT EXISTS (SELECT 1 FROM Warehouse)
BEGIN
    INSERT INTO Warehouse (Name, Location, ManagerUserID)
    VALUES
    ('Central Supply Depot', 'Lahore', 5),
    ('Karachi Storage Hub', 'Karachi', 6),
    ('Islamabad Reserve Center', 'Islamabad', 5);
END
GO

IF NOT EXISTS (SELECT 1 FROM Resource)
BEGIN
    INSERT INTO Resource (ResourceType, AvailableQuantity, Unit, ThresholdLevel, WarehouseID)
    VALUES
    ('Food', 1000, 'Packets', 200, 1),
    ('Water', 2000, 'Liters', 500, 1),
    ('Medicine', 500, 'Boxes', 100, 2),
    ('Shelter', 300, 'Units', 50, 3),
    ('Blankets', 800, 'Pieces', 150, 2);
END
GO

IF NOT EXISTS (SELECT 1 FROM Hospital)
BEGIN
    INSERT INTO Hospital (Name, Location, TotalBeds, AvailableBeds)
    VALUES
    ('Mayo Hospital', 'Lahore', 1200, 340),
    ('Jinnah Postgraduate Medical Centre', 'Karachi', 1500, 420),
    ('Pakistan Institute of Medical Sciences', 'Islamabad', 900, 260),
    ('Lady Reading Hospital', 'Peshawar', 1100, 180),
    ('Civil Hospital Quetta', 'Quetta', 700, 95);
END
GO

IF NOT EXISTS (SELECT 1 FROM BudgetTracking)
BEGIN
    INSERT INTO BudgetTracking (DisasterType, FiscalYear, AllocatedAmount, SpentAmount)
    VALUES
    ('Flood', 2026, 5000000, 850000),
    ('Earthquake', 2026, 7000000, 1250000),
    ('Fire', 2026, 2500000, 420000),
    ('Cyclone', 2026, 3500000, 0),
    ('Landslide', 2026, 1800000, 0);
END
GO

IF NOT EXISTS (SELECT 1 FROM FinancialTransaction)
BEGIN
    INSERT INTO FinancialTransaction (Type, Amount, Description, ReportID, UserID, Timestamp, BudgetID)
    VALUES
    ('Donation', 1500000, 'Corporate emergency relief fund', 1, 9, DATEADD(HOUR, -9, GETDATE()), NULL),
    ('Expense', 225000, 'Food packets and drinking water dispatch', 1, 9, DATEADD(HOUR, -7, GETDATE()), 1),
    ('Procurement', 390000, 'Medicine boxes for field camps', 3, 10, DATEADD(HOUR, -5, GETDATE()), 2);
END
GO

-- =====================================================
-- 5. PERMISSIONS & ROLE MAPPING
-- =====================================================
INSERT INTO Permission (PermissionName, Description)
SELECT * FROM (VALUES
    ('CREATE_REPORT', 'Submit emergency report'),
    ('UPDATE_REPORT_STATUS', 'Change report status'),
    ('VIEW_ALL_REPORTS', 'See all reports'),
    ('ASSIGN_TEAM', 'Assign rescue team to report'),
    ('UPDATE_TEAM_STATUS', 'Change team availability'),
    ('REQUEST_RESOURCE', 'Create resource request'),
    ('APPROVE_RESOURCE', 'Approve resource allocation'),
    ('VIEW_INVENTORY', 'See resource stock levels'),
    ('MANAGE_HOSPITAL', 'Admit/discharge patients'),
    ('VIEW_FINANCE', 'See financial transactions'),
    ('RECORD_DONATION', 'Add donation entry'),
    ('RECORD_EXPENSE', 'Add expense (needs approval)'),
    ('APPROVE_EXPENSE', 'Approve financial expense'),
    ('VIEW_BUDGET', 'See budget allocations'),
    ('APPROVE_ANY', 'Approve any request (Admin)')
) AS v(PermissionName, Description)
WHERE NOT EXISTS (SELECT 1 FROM Permission WHERE PermissionName = v.PermissionName);
GO

-- Assign all permissions to Admin (RoleID=1)
INSERT INTO RolePermission (RoleID, PermissionID)
SELECT 1, PermissionID FROM Permission
WHERE NOT EXISTS (SELECT 1 FROM RolePermission WHERE RoleID = 1 AND PermissionID = Permission.PermissionID);
GO

-- Emergency Operator (RoleID=2)
INSERT INTO RolePermission (RoleID, PermissionID)
SELECT 2, p.PermissionID FROM Permission p
WHERE p.PermissionName IN ('CREATE_REPORT','UPDATE_REPORT_STATUS','VIEW_ALL_REPORTS','REQUEST_RESOURCE')
AND NOT EXISTS (SELECT 1 FROM RolePermission WHERE RoleID = 2 AND PermissionID = p.PermissionID);
GO

-- Field Officer (RoleID=3)
INSERT INTO RolePermission (RoleID, PermissionID)
SELECT 3, p.PermissionID FROM Permission p
WHERE p.PermissionName IN ('UPDATE_TEAM_STATUS','VIEW_ALL_REPORTS','REQUEST_RESOURCE','ASSIGN_TEAM')
AND NOT EXISTS (SELECT 1 FROM RolePermission WHERE RoleID = 3 AND PermissionID = p.PermissionID);
GO

-- Warehouse Manager (RoleID=4)
INSERT INTO RolePermission (RoleID, PermissionID)
SELECT 4, p.PermissionID FROM Permission p
WHERE p.PermissionName IN ('VIEW_INVENTORY','REQUEST_RESOURCE','APPROVE_RESOURCE')
AND NOT EXISTS (SELECT 1 FROM RolePermission WHERE RoleID = 4 AND PermissionID = p.PermissionID);
GO

-- Finance Officer (RoleID=5)
INSERT INTO RolePermission (RoleID, PermissionID)
SELECT 5, p.PermissionID FROM Permission p
WHERE p.PermissionName IN ('VIEW_FINANCE','RECORD_DONATION','RECORD_EXPENSE','APPROVE_EXPENSE','VIEW_BUDGET')
AND NOT EXISTS (SELECT 1 FROM RolePermission WHERE RoleID = 5 AND PermissionID = p.PermissionID);
GO

-- =====================================================
-- 6. HELPER FUNCTION: CHECK PERMISSION
-- =====================================================
CREATE OR ALTER FUNCTION fn_UserHasPermission (
    @UserID INT,
    @PermissionName VARCHAR(100)
)
RETURNS BIT
AS
BEGIN
    RETURN ISNULL((
        SELECT 1
        FROM Users u
        JOIN RolePermission rp ON u.RoleID = rp.RoleID
        JOIN Permission p ON rp.PermissionID = p.PermissionID
        WHERE u.UserID = @UserID AND p.PermissionName = @PermissionName
    ), 0);
END;
GO

-- =====================================================
-- 7. STORED PROCEDURES & FUNCTIONS (All Modules)
-- =====================================================

-- Emergency Reporting
CREATE OR ALTER PROCEDURE sp_SubmitEmergencyReport
    @Location VARCHAR(255),
    @DisasterType VARCHAR(50),
    @SeverityLevel VARCHAR(20),
    @Description TEXT,
    @ReportedByUserID INT,
    @NewReportID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_UserHasPermission(@ReportedByUserID, 'CREATE_REPORT') = 0
        THROW 50001, 'Permission denied', 1;

    INSERT INTO EmergencyReport (Location, DisasterType, SeverityLevel, Description, Status, ReportedByUserID)
    VALUES (@Location, @DisasterType, @SeverityLevel, @Description, 'Open', @ReportedByUserID);

    SET @NewReportID = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE sp_UpdateReportStatus
    @ReportID INT,
    @NewStatus VARCHAR(20),
    @CurrentUserID INT
AS
BEGIN
    IF dbo.fn_UserHasPermission(@CurrentUserID, 'UPDATE_REPORT_STATUS') = 0
        THROW 50001, 'Permission denied', 1;
    UPDATE EmergencyReport SET Status = @NewStatus WHERE ReportID = @ReportID;
END;
GO

CREATE OR ALTER PROCEDURE sp_FilterReports
    @DisasterType VARCHAR(50) = NULL,
    @Severity VARCHAR(20) = NULL,
    @Location VARCHAR(255) = NULL,
    @StartDate DATETIME = NULL,
    @EndDate DATETIME = NULL
AS
BEGIN
    SELECT * FROM EmergencyReport
    WHERE (@DisasterType IS NULL OR DisasterType = @DisasterType)
      AND (@Severity IS NULL OR SeverityLevel = @Severity)
      AND (@Location IS NULL OR Location LIKE '%' + @Location + '%')
      AND (@StartDate IS NULL OR ReportedAt >= @StartDate)
      AND (@EndDate IS NULL OR ReportedAt <= @EndDate)
    ORDER BY ReportedAt DESC;
END;
GO

-- Function for high priority reports (multi-statement to allow ORDER BY)
CREATE OR ALTER FUNCTION fn_GetHighPriorityReports()
RETURNS @Result TABLE (
    ReportID INT, Location VARCHAR(255), DisasterType VARCHAR(50),
    SeverityLevel VARCHAR(20), Description TEXT, Status VARCHAR(20),
    ReportedAt DATETIME, ReportedByUserID INT
)
AS
BEGIN
    INSERT INTO @Result
    SELECT * FROM EmergencyReport
    WHERE SeverityLevel IN ('High', 'Critical');
    RETURN;
END;
GO

-- Rescue Team
CREATE OR ALTER PROCEDURE sp_AssignRescueTeam
    @ReportID INT,
    @PreferredTeamType VARCHAR(20),
    @CurrentUserID INT,
    @AssignedTeamID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF dbo.fn_UserHasPermission(@CurrentUserID, 'ASSIGN_TEAM') = 0
            THROW 50001, 'Permission denied', 1;

        SELECT TOP 1 @AssignedTeamID = TeamID
        FROM RescueTeam
        WHERE TeamType = @PreferredTeamType AND Status = 'Available'
        ORDER BY TeamID;

        IF @AssignedTeamID IS NULL
            THROW 50002, 'No available team of required type', 1;

        INSERT INTO TeamAssignment (ReportID, TeamID, Status, AssignedAt)
        VALUES (@ReportID, @AssignedTeamID, 'Assigned', GETDATE());

        UPDATE RescueTeam SET Status = 'Assigned' WHERE TeamID = @AssignedTeamID;
        UPDATE EmergencyReport SET Status = 'InProgress' WHERE ReportID = @ReportID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_UpdateTeamStatus
    @TeamID INT,
    @NewStatus VARCHAR(20),
    @CurrentUserID INT
AS
BEGIN
    IF dbo.fn_UserHasPermission(@CurrentUserID, 'UPDATE_TEAM_STATUS') = 0
        THROW 50001, 'Permission denied', 1;

    UPDATE RescueTeam SET Status = @NewStatus WHERE TeamID = @TeamID;
    IF @NewStatus = 'Completed'
        UPDATE TeamAssignment SET Status = 'Completed', CompletedAt = GETDATE()
        WHERE TeamID = @TeamID AND Status IN ('Assigned','InProgress');
END;
GO

CREATE OR ALTER FUNCTION fn_AvailableTeamsByType (@TeamType VARCHAR(20))
RETURNS TABLE
AS
RETURN
    SELECT * FROM RescueTeam WHERE TeamType = @TeamType AND Status = 'Available';
GO

-- Resource Management
CREATE OR ALTER PROCEDURE sp_RequestResource
    @ResourceID INT,
    @ReportID INT,
    @Quantity INT,
    @RequestedByUserID INT,
    @AllocationID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF dbo.fn_UserHasPermission(@RequestedByUserID, 'REQUEST_RESOURCE') = 0
            THROW 50001, 'Permission denied', 1;

        INSERT INTO ResourceAllocation (ResourceID, ReportID, QuantityAllocated, Status, ApprovedByUserID)
        VALUES (@ResourceID, @ReportID, @Quantity, 'Pending', NULL);
        SET @AllocationID = SCOPE_IDENTITY();

        INSERT INTO Approval (RequestType, ReferenceType, ReferenceID, Status, RequestedByUserID)
        VALUES ('ResourceAllocation', 'ResourceAllocation', @AllocationID, 'Pending', @RequestedByUserID);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ApproveResourceRequest
    @AllocationID INT,
    @ApproverUserID INT,
    @Remarks TEXT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF dbo.fn_UserHasPermission(@ApproverUserID, 'APPROVE_RESOURCE') = 0
            AND dbo.fn_UserHasPermission(@ApproverUserID, 'APPROVE_ANY') = 0
            THROW 50001, 'Permission denied', 1;

        DECLARE @ResourceID INT, @Quantity INT, @CurrentStock INT;
        SELECT @ResourceID = ResourceID, @Quantity = QuantityAllocated
        FROM ResourceAllocation WHERE AllocationID = @AllocationID AND Status = 'Pending';
        IF @ResourceID IS NULL THROW 50002, 'Allocation not found or already processed', 1;

        SELECT @CurrentStock = AvailableQuantity FROM Resource WHERE ResourceID = @ResourceID;
        IF @CurrentStock < @Quantity THROW 50003, 'Insufficient stock', 1;

        UPDATE Resource SET AvailableQuantity = AvailableQuantity - @Quantity WHERE ResourceID = @ResourceID;
        UPDATE ResourceAllocation SET Status = 'Approved', ApprovedByUserID = @ApproverUserID WHERE AllocationID = @AllocationID;
        UPDATE Approval SET Status = 'Approved', DecidedAt = GETDATE(), ApprovedByUserID = @ApproverUserID, Remarks = @Remarks
        WHERE ReferenceType = 'ResourceAllocation' AND ReferenceID = @AllocationID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_UpdateConsumedResources
    @AllocationID INT,
    @ConsumedQuantity INT,
    @CurrentUserID INT
AS
BEGIN
    IF dbo.fn_UserHasPermission(@CurrentUserID, 'UPDATE_TEAM_STATUS') = 0
        THROW 50001, 'Permission denied', 1;
    UPDATE ResourceAllocation
    SET TotalConsumed = @ConsumedQuantity,
        Status = CASE WHEN @ConsumedQuantity >= QuantityAllocated THEN 'Consumed' ELSE Status END
    WHERE AllocationID = @AllocationID;
END;
GO

-- Low Stock Alert Trigger
CREATE OR ALTER TRIGGER trg_CheckLowStock
ON Resource
AFTER UPDATE
AS
BEGIN
    IF UPDATE(AvailableQuantity)
    BEGIN
        INSERT INTO LowStockAlert (ResourceID, Message)
        SELECT i.ResourceID, 'Stock fell below threshold'
        FROM inserted i JOIN deleted d ON i.ResourceID = d.ResourceID
        WHERE i.AvailableQuantity <= i.ThresholdLevel AND d.AvailableQuantity > d.ThresholdLevel;
    END
END;
GO

-- Hospital Coordination
CREATE OR ALTER PROCEDURE sp_AdmitPatient
    @FullName VARCHAR(100),
    @Age INT,
    @Condition VARCHAR(20),
    @ReportID INT,
    @CurrentUserID INT,
    @AssignedHospitalID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF dbo.fn_UserHasPermission(@CurrentUserID, 'MANAGE_HOSPITAL') = 0
            THROW 50001, 'Permission denied', 1;

        SELECT TOP 1 @AssignedHospitalID = HospitalID
        FROM Hospital WHERE AvailableBeds > 0 ORDER BY AvailableBeds DESC;

        IF @AssignedHospitalID IS NULL
        BEGIN
            INSERT INTO EmergencyEscalation (ReportID, PatientName, RequiredBeds)
            VALUES (@ReportID, @FullName, 1);
            THROW 50002, 'No beds available – escalated', 1;
        END

        INSERT INTO Patient (FullName, Age, Condition, Status, HospitalID, ReportID, AdmittedAt)
        VALUES (@FullName, @Age, @Condition, 'Admitted', @AssignedHospitalID, @ReportID, GETDATE());

        UPDATE Hospital SET AvailableBeds = AvailableBeds - 1 WHERE HospitalID = @AssignedHospitalID;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_DischargePatient
    @PatientID INT,
    @CurrentUserID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF dbo.fn_UserHasPermission(@CurrentUserID, 'MANAGE_HOSPITAL') = 0
            THROW 50001, 'Permission denied', 1;

        DECLARE @HospitalID INT;
        SELECT @HospitalID = HospitalID FROM Patient WHERE PatientID = @PatientID AND Status = 'Admitted';
        IF @HospitalID IS NULL THROW 50002, 'Patient not found or already discharged', 1;

        UPDATE Patient SET Status = 'Discharged' WHERE PatientID = @PatientID;
        UPDATE Hospital SET AvailableBeds = AvailableBeds + 1 WHERE HospitalID = @HospitalID;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER FUNCTION fn_GetHospitalLoad (@HospitalID INT)
RETURNS DECIMAL(5,2)
AS
BEGIN
    DECLARE @Load DECIMAL(5,2);
    SELECT @Load = (CAST(TotalBeds - AvailableBeds AS DECIMAL) / NULLIF(TotalBeds,0)) * 100
    FROM Hospital WHERE HospitalID = @HospitalID;
    RETURN ISNULL(@Load, 0);
END;
GO

-- Financial Management
CREATE OR ALTER PROCEDURE sp_RecordDonation
    @Amount DECIMAL(12,2),
    @Description TEXT,
    @ReportID INT,
    @UserID INT
AS
BEGIN
    IF dbo.fn_UserHasPermission(@UserID, 'RECORD_DONATION') = 0
        THROW 50001, 'Permission denied', 1;
    INSERT INTO FinancialTransaction (Type, Amount, Description, ReportID, UserID, Timestamp)
    VALUES ('Donation', @Amount, @Description, @ReportID, @UserID, GETDATE());
END;
GO

CREATE OR ALTER PROCEDURE sp_RecordExpense
    @Amount DECIMAL(12,2),
    @Description TEXT,
    @ReportID INT,
    @DisasterType VARCHAR(50),
    @UserID INT,
    @TransactionID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF dbo.fn_UserHasPermission(@UserID, 'RECORD_EXPENSE') = 0
            THROW 50001, 'Permission denied', 1;

        INSERT INTO FinancialTransaction (Type, Amount, Description, ReportID, UserID, Timestamp)
        VALUES ('Expense', @Amount, @Description, @ReportID, @UserID, GETDATE());
        SET @TransactionID = SCOPE_IDENTITY();

        INSERT INTO Approval (RequestType, ReferenceType, ReferenceID, Status, RequestedByUserID)
        VALUES ('Financial', 'FinancialTransaction', @TransactionID, 'Pending', @UserID);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_ApproveExpense
    @TransactionID INT,
    @ApproverUserID INT,
    @BudgetID INT,
    @Remarks TEXT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF dbo.fn_UserHasPermission(@ApproverUserID, 'APPROVE_EXPENSE') = 0
            AND dbo.fn_UserHasPermission(@ApproverUserID, 'APPROVE_ANY') = 0
            THROW 50001, 'Permission denied', 1;

        DECLARE @Amount DECIMAL(12,2), @CurrentSpent DECIMAL(12,2), @Allocated DECIMAL(12,2);
        SELECT @Amount = Amount FROM FinancialTransaction WHERE TransactionID = @TransactionID AND Type = 'Expense';
        SELECT @Allocated = AllocatedAmount, @CurrentSpent = SpentAmount FROM BudgetTracking WHERE BudgetID = @BudgetID;
        IF @Allocated IS NULL THROW 50002, 'Budget not found', 1;
        IF (@CurrentSpent + @Amount) > @Allocated THROW 50003, 'Insufficient budget', 1;

        UPDATE BudgetTracking SET SpentAmount = SpentAmount + @Amount WHERE BudgetID = @BudgetID;
        UPDATE FinancialTransaction SET BudgetID = @BudgetID WHERE TransactionID = @TransactionID;
        UPDATE Approval SET Status = 'Approved', DecidedAt = GETDATE(), ApprovedByUserID = @ApproverUserID, Remarks = @Remarks
        WHERE ReferenceType = 'FinancialTransaction' AND ReferenceID = @TransactionID;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_GenerateFinancialAuditTrail
    @StartDate DATETIME = NULL,
    @EndDate DATETIME = NULL
AS
BEGIN
    SELECT * FROM AuditLog
    WHERE TableAffected = 'FinancialTransaction'
      AND (@StartDate IS NULL OR Timestamp >= @StartDate)
      AND (@EndDate IS NULL OR Timestamp <= @EndDate)
    ORDER BY Timestamp;
END;
GO

-- Approval Workflow
CREATE OR ALTER PROCEDURE sp_GetPendingApprovalsByRole
    @RoleID INT
AS
BEGIN
    SELECT a.*, u.FullName AS RequestedByName
    FROM Approval a
    JOIN Users u ON a.RequestedByUserID = u.UserID
    WHERE a.Status = 'Pending'
      AND (
          (@RoleID = 1) OR
          (@RoleID = 4 AND a.RequestType = 'ResourceAllocation') OR
          (@RoleID = 5 AND a.RequestType = 'Financial')
      )
    ORDER BY a.RequestedAt;
END;
GO

CREATE OR ALTER PROCEDURE sp_ProcessApproval
    @ApprovalID INT,
    @Action VARCHAR(10),
    @ApproverUserID INT,
    @Remarks TEXT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @RequestType VARCHAR(50), @ReferenceType VARCHAR(50), @ReferenceID INT;
    SELECT @RequestType = RequestType, @ReferenceType = ReferenceType, @ReferenceID = ReferenceID
    FROM Approval WHERE ApprovalID = @ApprovalID AND Status = 'Pending';
    IF @RequestType IS NULL THROW 50001, 'Approval not found or already processed', 1;

    IF @Action = 'Reject'
    BEGIN
        UPDATE Approval SET Status = 'Rejected', DecidedAt = GETDATE(), ApprovedByUserID = @ApproverUserID, Remarks = @Remarks
        WHERE ApprovalID = @ApprovalID;
        RETURN;
    END

    IF @RequestType = 'ResourceAllocation'
        EXEC sp_ApproveResourceRequest @AllocationID = @ReferenceID, @ApproverUserID = @ApproverUserID, @Remarks = @Remarks;
    ELSE IF @RequestType = 'Financial'
        PRINT 'Use sp_ApproveExpense directly for financial approvals.';
END;
GO

-- High-volume simulation
CREATE OR ALTER PROCEDURE sp_SimulateHighFrequencyReports
    @Count INT
AS
BEGIN
    DECLARE @i INT = 0;
    WHILE @i < @Count
    BEGIN
        INSERT INTO EmergencyReport (Location, DisasterType, SeverityLevel, Description, Status, ReportedByUserID)
        VALUES ('TestLoc', 'Flood', 'Low', 'Auto test', 'Open', 2);
        SET @i = @i + 1;
    END
END;
GO

-- =====================================================
-- 8. ADDITIONAL VIEWS
-- =====================================================
CREATE OR ALTER VIEW vw_WarehouseManagerView AS
SELECT
    w.WarehouseID, w.Name AS WarehouseName, w.Location,
    r.ResourceType, r.AvailableQuantity, r.ThresholdLevel,
    CASE WHEN r.AvailableQuantity <= r.ThresholdLevel THEN 'ORDER MORE' ELSE 'OK' END AS StockAction
FROM Warehouse w
JOIN Resource r ON w.WarehouseID = r.WarehouseID;
GO

CREATE OR ALTER VIEW vw_FinancialSummary AS
SELECT
    er.DisasterType,
    SUM(CASE WHEN ft.Type = 'Donation' THEN ft.Amount ELSE 0 END) AS TotalDonations,
    SUM(CASE WHEN ft.Type = 'Expense' THEN ft.Amount ELSE 0 END) AS TotalExpenses,
    SUM(CASE WHEN ft.Type = 'Procurement' THEN ft.Amount ELSE 0 END) AS TotalProcurement,
    SUM(CASE WHEN ft.Type = 'Donation' THEN ft.Amount ELSE -ft.Amount END) AS NetBalance
FROM FinancialTransaction ft
JOIN EmergencyReport er ON ft.ReportID = er.ReportID
GROUP BY er.DisasterType;
GO

CREATE OR ALTER VIEW vw_HospitalStatus AS
SELECT
    HospitalID, Name, Location, TotalBeds, AvailableBeds,
    (TotalBeds - AvailableBeds) AS OccupiedBeds,
    CAST((TotalBeds - AvailableBeds) * 100.0 / NULLIF(TotalBeds, 0) AS DECIMAL(5,2)) AS LoadPercentage
FROM Hospital;
GO

CREATE OR ALTER VIEW vw_FinanceView AS
SELECT 
    ft.TransactionID, ft.Type, ft.Amount, ft.Timestamp,
    er.Location, u.FullName AS RecordedBy
FROM FinancialTransaction ft
JOIN EmergencyReport er ON ft.ReportID = er.ReportID
JOIN Users u ON ft.UserID = u.UserID;
GO

CREATE OR ALTER VIEW vw_FieldOfficerView AS
SELECT 
    er.ReportID, er.Location, er.DisasterType, er.SeverityLevel, er.Status,
    rt.TeamName, ta.Status AS AssignmentStatus
FROM EmergencyReport er
LEFT JOIN TeamAssignment ta ON er.ReportID = ta.ReportID
LEFT JOIN RescueTeam rt ON ta.TeamID = rt.TeamID;
GO

CREATE OR ALTER VIEW vw_ResourceStatus AS
SELECT 
    r.ResourceID, r.ResourceType, r.AvailableQuantity, r.ThresholdLevel,
    w.Name AS WarehouseName,
    CASE WHEN r.AvailableQuantity <= r.ThresholdLevel THEN 'LOW STOCK' ELSE 'SUFFICIENT' END AS StockStatus
FROM Resource r
JOIN Warehouse w ON r.WarehouseID = w.WarehouseID;
GO

-- =====================================================
-- 9. INDEXES (conditional creation for SQL Server)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_location' AND object_id = OBJECT_ID('EmergencyReport'))
    CREATE INDEX idx_location ON EmergencyReport(Location);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_disaster_type' AND object_id = OBJECT_ID('EmergencyReport'))
    CREATE INDEX idx_disaster_type ON EmergencyReport(DisasterType);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_location_severity' AND object_id = OBJECT_ID('EmergencyReport'))
    CREATE INDEX idx_location_severity ON EmergencyReport(Location, SeverityLevel);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_transaction_time' AND object_id = OBJECT_ID('FinancialTransaction'))
    CREATE INDEX idx_transaction_time ON FinancialTransaction(Timestamp);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_resource_type' AND object_id = OBJECT_ID('Resource'))
    CREATE INDEX idx_resource_type ON Resource(ResourceType);
GO
