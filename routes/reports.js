const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/rbac');
const { asyncHandler, toInt } = require('../utils/routeHelpers');

// POST /api/reports - Submit new emergency report
// Roles: Admin(1), Operator(2), Field Officer(3)

router.post('/', verifyToken, checkRole([1,2,3]), asyncHandler(async (req, res) => {
        const { location, disasterType, severityLevel, description } = req.body;

        if (!location || !disasterType || !severityLevel) {
            return res.status(400).json({ 
                error: 'Location, disasterType and severityLevel are required.' 
            });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('Location',         sql.NVarChar(255),     location)
            .input('DisasterType',     sql.NVarChar(50),      disasterType)
            .input('SeverityLevel',    sql.NVarChar(20),      severityLevel)
            .input('Description',      sql.NVarChar(sql.MAX), description || '')
            .input('ReportedByUserID', sql.Int,               req.user.userID)
            .output('NewReportID',     sql.Int)
            .execute('sp_SubmitEmergencyReport');

        res.status(201).json({ 
            message: 'Emergency report submitted successfully!',
            reportID: result.output.NewReportID
        });
}));

// GET /api/reports - Get all reports with optional filters
// Roles: All
router.get('/', verifyToken, asyncHandler(async (req, res) => {
        const { disasterType, severity, severityLevel, location, status, startDate, endDate } = req.query;

        const pool = await getPool();
        const request = pool.request()
            .input('DisasterType', sql.VarChar(50), disasterType || null)
            .input('Severity', sql.VarChar(20), severity || severityLevel || null)
            .input('Location', sql.VarChar(255), location || null)
            .input('Status', sql.VarChar(20), status || null)
            .input('StartDate', sql.DateTime, startDate || null)
            .input('EndDate', sql.DateTime, endDate || null);

        const result = await request.query(`
            SELECT er.*, u.FullName AS ReportedByName
            FROM EmergencyReport er
            LEFT JOIN Users u ON er.ReportedByUserID = u.UserID
            WHERE (@DisasterType IS NULL OR er.DisasterType = @DisasterType)
              AND (@Severity IS NULL OR er.SeverityLevel = @Severity)
              AND (@Location IS NULL OR er.Location LIKE '%' + @Location + '%')
              AND (@Status IS NULL OR er.Status = @Status)
              AND (@StartDate IS NULL OR er.ReportedAt >= @StartDate)
              AND (@EndDate IS NULL OR er.ReportedAt <= @EndDate)
            ORDER BY 
              CASE er.SeverityLevel WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
              er.ReportedAt DESC
        `);

        res.json({ 
            count: result.recordset.length,
            reports: result.recordset 
        });
}));

// PUT /api/reports/:id/status - Update report status
// Roles: Admin(1), Operator(2)
router.put('/:id/status', verifyToken, checkRole([1,2]), asyncHandler(async (req, res) => {
        const { newStatus } = req.body;
        const reportID = toInt(req.params.id);

        if (!newStatus) {
            return res.status(400).json({ error: 'newStatus is required.' });
        }

        const pool = await getPool();
        await pool.request()
            .input('ReportID',      sql.Int,        reportID)
            .input('NewStatus',     sql.NVarChar(20), newStatus)
            .input('CurrentUserID', sql.Int,        req.user.userID)
            .execute('sp_UpdateReportStatus');

        res.json({ message: `Report ${reportID} status updated to ${newStatus}` });
}));

module.exports = router;
