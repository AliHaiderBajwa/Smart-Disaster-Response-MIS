const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/rbac');
const { asyncHandler, toInt } = require('../utils/routeHelpers');

// GET /api/hospitals/capacity
router.get('/capacity', verifyToken, asyncHandler(async (req, res) => {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM vw_HospitalStatus ORDER BY LoadPercentage DESC, Name');
        res.json({ hospitals: result.recordset });
}));

// POST /api/hospitals/admit - Admit patient
// Roles: Admin(1), Operator(2)
router.post('/admit', verifyToken, checkRole([1,2]), asyncHandler(async (req, res) => {
        const { fullName, age, condition, reportID } = req.body;
        if (!fullName || !age || !condition || !reportID) {
            return res.status(400).json({ error: 'fullName, age, condition and reportID are required.' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('FullName',          sql.NVarChar(100), fullName)
            .input('Age',               sql.Int,           age)
            .input('Condition',         sql.NVarChar(20),  condition)
            .input('ReportID',          sql.Int,           reportID)
            .input('CurrentUserID',     sql.Int,           req.user.userID)
            .output('AssignedHospitalID', sql.Int)
            .execute('sp_AdmitPatient');

        res.status(201).json({
            message: 'Patient admitted successfully!',
            hospitalID: result.output.AssignedHospitalID
        });
}));

router.get('/patients', verifyToken, asyncHandler(async (req, res) => {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT p.*, h.Name AS HospitalName, h.Location AS HospitalLocation, er.DisasterType, er.Location AS IncidentLocation
        FROM Patient p
        LEFT JOIN Hospital h ON p.HospitalID = h.HospitalID
        LEFT JOIN EmergencyReport er ON p.ReportID = er.ReportID
        ORDER BY p.AdmittedAt DESC
    `);
    res.json({ count: result.recordset.length, patients: result.recordset });
}));

// PUT /api/hospitals/patients/:id - Update patient status
// Roles: Admin(1), Operator(2)
router.put('/patients/:id', verifyToken, checkRole([1,2]), asyncHandler(async (req, res) => {
        const { newStatus } = req.body;
        const patientID = toInt(req.params.id);

        if (!newStatus) {
            return res.status(400).json({ error: 'newStatus is required.' });
        }

        const pool = await getPool();
        if (newStatus === 'Discharged') {
            await pool.request()
                .input('PatientID', sql.Int, patientID)
                .input('CurrentUserID', sql.Int, req.user.userID)
                .execute('sp_DischargePatient');
        } else {
            await pool.request()
                .input('PatientID', sql.Int, patientID)
                .input('NewStatus', sql.VarChar(20), newStatus)
                .query('UPDATE Patient SET Status = @NewStatus WHERE PatientID = @PatientID');
        }

        res.json({ message: `Patient ${patientID} status updated to ${newStatus}` });
}));

router.get('/escalations', verifyToken, checkRole([1,2]), asyncHandler(async (req, res) => {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT ee.*, er.Location, er.DisasterType
        FROM EmergencyEscalation ee
        LEFT JOIN EmergencyReport er ON ee.ReportID = er.ReportID
        ORDER BY ee.EscalatedAt DESC
    `);
    res.json({ count: result.recordset.length, escalations: result.recordset });
}));

module.exports = router;
