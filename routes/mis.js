const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/rbac');
const { asyncHandler, toInt } = require('../utils/routeHelpers');

// GET /api/mis/incidents - Incident statistics
router.get('/incidents', verifyToken, asyncHandler(async (req, res) => {
        const { startDate, endDate } = req.query;
        const pool = await getPool();
        const result = await pool.request()
            .input('StartDate', sql.DateTime, startDate || null)
            .input('EndDate',   sql.DateTime, endDate   || null)
            .query(`
                SELECT Location, DisasterType, SeverityLevel, Status, COUNT(*) AS TotalReports
                FROM EmergencyReport
                WHERE (@StartDate IS NULL OR ReportedAt >= @StartDate)
                  AND (@EndDate IS NULL OR ReportedAt <= @EndDate)
                GROUP BY Location, DisasterType, SeverityLevel, Status
                ORDER BY TotalReports DESC
            `);
        res.json({ statistics: result.recordset });
}));

// GET /api/mis/resources - Resource utilization report
router.get('/resources', verifyToken, asyncHandler(async (req, res) => {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT r.ResourceType,
                   SUM(r.AvailableQuantity) AS AvailableQuantity,
                   SUM(ISNULL(ra.QuantityAllocated, 0)) AS AllocatedQuantity,
                   SUM(ISNULL(ra.TotalConsumed, 0)) AS ConsumedQuantity
            FROM Resource r
            LEFT JOIN ResourceAllocation ra ON r.ResourceID = ra.ResourceID
            GROUP BY r.ResourceType
            ORDER BY r.ResourceType
        `);
        res.json({ utilization: result.recordset });
}));

// GET /api/mis/responsetime - Response time analytics
router.get('/responsetime', verifyToken, asyncHandler(async (req, res) => {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT er.DisasterType,
                   er.SeverityLevel,
                   AVG(DATEDIFF(MINUTE, er.ReportedAt, ISNULL(ta.AssignedAt, GETDATE()))) AS AvgMinutesToAssignment,
                   COUNT(ta.AssignmentID) AS AssignmentCount
            FROM EmergencyReport er
            LEFT JOIN TeamAssignment ta ON er.ReportID = ta.ReportID
            GROUP BY er.DisasterType, er.SeverityLevel
            ORDER BY AvgMinutesToAssignment ASC
        `);
        res.json({ analytics: result.recordset });
}));

// GET /api/mis/audit - Audit log (Admin only)
router.get('/audit', verifyToken, checkRole([1]), asyncHandler(async (req, res) => {
        const { topN, tableAffected } = req.query;
        const pool = await getPool();
        const result = await pool.request()
            .input('TopN', sql.Int, toInt(topN, 100))
            .input('TableAffected', sql.VarChar(50), tableAffected || null)
            .query(`
                SELECT TOP (@TopN) al.*, u.FullName
                FROM AuditLog al
                LEFT JOIN Users u ON al.UserID = u.UserID
                WHERE (@TableAffected IS NULL OR al.TableAffected = @TableAffected)
                ORDER BY al.Timestamp DESC
            `);
        res.json({ count: result.recordset.length, logs: result.recordset });
}));

router.get('/dashboard', verifyToken, asyncHandler(async (req, res) => {
    const pool = await getPool();
    const [reports, resources, hospitals, approvals, finance, teams] = await Promise.all([
        pool.request().query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN Status = 'Open' THEN 1 ELSE 0 END) AS openReports,
                SUM(CASE WHEN SeverityLevel = 'Critical' THEN 1 ELSE 0 END) AS criticalReports
            FROM EmergencyReport
        `),
        pool.request().query(`
            SELECT COUNT(*) AS lowStock
            FROM Resource
            WHERE AvailableQuantity <= ThresholdLevel
        `),
        pool.request().query(`
            SELECT AVG(CAST(AvailableBeds AS FLOAT) / NULLIF(TotalBeds, 0) * 100) AS avgAvailableBedPercent
            FROM Hospital
        `),
        pool.request().query("SELECT COUNT(*) AS pendingApprovals FROM Approval WHERE Status = 'Pending'"),
        pool.request().query(`
            SELECT
                SUM(CASE WHEN Type = 'Donation' THEN Amount ELSE 0 END) AS donations,
                SUM(CASE WHEN Type IN ('Expense','Procurement') THEN Amount ELSE 0 END) AS spending
            FROM FinancialTransaction
        `),
        pool.request().query(`
            SELECT
                SUM(CASE WHEN Status = 'Available' THEN 1 ELSE 0 END) AS availableTeams,
                COUNT(*) AS totalTeams
            FROM RescueTeam
        `)
    ]);

    res.json({
        reports: reports.recordset[0],
        resources: resources.recordset[0],
        hospitals: hospitals.recordset[0],
        approvals: approvals.recordset[0],
        finance: finance.recordset[0],
        teams: teams.recordset[0]
    });
}));

module.exports = router;
