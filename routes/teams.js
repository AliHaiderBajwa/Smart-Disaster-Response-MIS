const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/rbac');
const { asyncHandler, toInt } = require('../utils/routeHelpers');

// GET /api/teams - Get all teams with status
router.get('/', verifyToken, asyncHandler(async (req, res) => {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT rt.*,
                   ta.AssignmentID,
                   ta.ReportID,
                   ta.Status AS AssignmentStatus,
                   er.Location AS IncidentLocation,
                   er.SeverityLevel
            FROM RescueTeam rt
            LEFT JOIN TeamAssignment ta ON rt.TeamID = ta.TeamID AND ta.Status IN ('Assigned','InProgress')
            LEFT JOIN EmergencyReport er ON ta.ReportID = er.ReportID
            ORDER BY rt.TeamType, rt.Status, rt.TeamName
        `);
        res.json({ count: result.recordset.length, teams: result.recordset });
}));

// POST /api/teams/assign - Assign team to report
// Roles: Admin(1), Operator(2), Field Officer(3)
router.post('/assign', verifyToken, checkRole([1,2,3]), asyncHandler(async (req, res) => {
        const { reportID, preferredTeamType, teamType } = req.body;
        const selectedTeamType = preferredTeamType || teamType;
        if (!reportID || !selectedTeamType) {
            return res.status(400).json({ error: 'reportID and preferredTeamType are required.' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('ReportID',      sql.Int, reportID)
            .input('PreferredTeamType', sql.VarChar(20), selectedTeamType)
            .input('CurrentUserID', sql.Int, req.user.userID)
            .output('AssignedTeamID', sql.Int)
            .execute('sp_AssignRescueTeam');

        res.status(201).json({
            message: 'Team assigned successfully!',
            teamID: result.output.AssignedTeamID
        });
}));

// POST /api/teams/complete - Complete an assignment/team
// Roles: Admin(1), Operator(2), Field Officer(3)
router.post('/complete', verifyToken, checkRole([1,2,3]), asyncHandler(async (req, res) => {
        const { assignmentID, teamID } = req.body;
        let selectedTeamID = toInt(teamID);

        const pool = await getPool();
        if (!selectedTeamID && assignmentID) {
            const lookup = await pool.request()
                .input('AssignmentID', sql.Int, assignmentID)
                .query('SELECT TeamID FROM TeamAssignment WHERE AssignmentID = @AssignmentID');
            selectedTeamID = lookup.recordset[0]?.TeamID;
        }

        if (!selectedTeamID) {
            return res.status(400).json({ error: 'teamID or assignmentID is required.' });
        }

        await pool.request()
            .input('TeamID', sql.Int, selectedTeamID)
            .input('NewStatus', sql.VarChar(20), 'Completed')
            .input('CurrentUserID', sql.Int, req.user.userID)
            .execute('sp_UpdateTeamStatus');

        res.json({ message: 'Assignment completed! Team is now available.' });
}));

router.put('/:id/status', verifyToken, checkRole([1,2,3]), asyncHandler(async (req, res) => {
    const { newStatus } = req.body;
    const teamID = toInt(req.params.id);

    if (!teamID || !newStatus) {
        return res.status(400).json({ error: 'teamID and newStatus are required.' });
    }

    const pool = await getPool();
    await pool.request()
        .input('TeamID', sql.Int, teamID)
        .input('NewStatus', sql.VarChar(20), newStatus)
        .input('CurrentUserID', sql.Int, req.user.userID)
        .execute('sp_UpdateTeamStatus');

    res.json({ message: `Team ${teamID} status updated to ${newStatus}` });
}));

module.exports = router;
