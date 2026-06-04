const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/rbac');
const { asyncHandler, toInt } = require('../utils/routeHelpers');

// POST /api/resources/request - Request resource allocation
// Roles: All logged in users
router.post('/request', verifyToken, asyncHandler(async (req, res) => {
        const { resourceID, reportID, quantity } = req.body;
        if (!resourceID || !reportID || !quantity) {
            return res.status(400).json({ error: 'resourceID, reportID and quantity are required.' });
        }
        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than 0.' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('ResourceID',        sql.Int, resourceID)
            .input('ReportID',          sql.Int, reportID)
            .input('Quantity',          sql.Int, quantity)
            .input('RequestedByUserID', sql.Int, req.user.userID)
            .output('AllocationID',     sql.Int)
            .execute('sp_RequestResource');

        res.status(201).json({
            message: 'Resource request submitted! Waiting for approval.',
            allocationID: result.output.AllocationID
        });
}));

// POST /api/resources/approve - Approve resource request
// Roles: Admin(1), Warehouse Manager(4)
router.post('/approve', verifyToken, checkRole([1,4]), asyncHandler(async (req, res) => {
        const { allocationID, remarks } = req.body;
        if (!allocationID) {
            return res.status(400).json({ error: 'allocationID is required.' });
        }

        const pool = await getPool();
        await pool.request()
            .input('AllocationID',  sql.Int,          allocationID)
            .input('ApproverUserID', sql.Int,         req.user.userID)
            .input('Remarks',       sql.NVarChar(sql.MAX), remarks || null)
            .execute('sp_ApproveResourceRequest');

        res.json({ message: 'Resource request approved and stock updated!' });
}));

// POST /api/resources/reject - Reject resource request
// Roles: Admin(1), Warehouse Manager(4)
router.post('/reject', verifyToken, checkRole([1,4]), asyncHandler(async (req, res) => {
        const { allocationID, remarks } = req.body;
        if (!allocationID) {
            return res.status(400).json({ error: 'allocationID is required.' });
        }

        const pool = await getPool();
        const tx = new sql.Transaction(pool);
        await tx.begin();
        try {
            await new sql.Request(tx)
                .input('AllocationID', sql.Int, allocationID)
                .input('ApproverUserID', sql.Int, req.user.userID)
                .input('Remarks', sql.VarChar(sql.MAX), remarks || null)
                .query(`
                    UPDATE Approval
                    SET Status = 'Rejected', DecidedAt = GETDATE(), ApprovedByUserID = @ApproverUserID, Remarks = @Remarks
                    WHERE ReferenceType = 'ResourceAllocation' AND ReferenceID = @AllocationID AND Status = 'Pending'
                `);
            await tx.commit();
        } catch (err) {
            await tx.rollback();
            throw err;
        }

        res.json({ message: 'Resource request rejected.' });
}));

router.get('/inventory', verifyToken, checkRole([1,4]), asyncHandler(async (req, res) => {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM vw_ResourceStatus ORDER BY StockStatus DESC, ResourceType');
    res.json({ count: result.recordset.length, resources: result.recordset });
}));

router.get('/allocations', verifyToken, asyncHandler(async (req, res) => {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT ra.*, r.ResourceType, r.Unit, er.Location, er.DisasterType, u.FullName AS ApprovedByName
        FROM ResourceAllocation ra
        JOIN Resource r ON ra.ResourceID = r.ResourceID
        JOIN EmergencyReport er ON ra.ReportID = er.ReportID
        LEFT JOIN Users u ON ra.ApprovedByUserID = u.UserID
        ORDER BY ra.AllocatedAt DESC
    `);
    res.json({ count: result.recordset.length, allocations: result.recordset });
}));

// GET /api/resources/lowstock - Get low stock alerts
// Roles: Admin(1), Warehouse Manager(4)
router.get('/lowstock', verifyToken, checkRole([1,4]), asyncHandler(async (req, res) => {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT r.ResourceID, r.ResourceType, r.AvailableQuantity, r.ThresholdLevel, w.Name AS WarehouseName,
                   ISNULL(a.Status, 'New') AS AlertStatus, a.AlertTime
            FROM Resource r
            JOIN Warehouse w ON r.WarehouseID = w.WarehouseID
            LEFT JOIN LowStockAlert a ON r.ResourceID = a.ResourceID
            WHERE r.AvailableQuantity <= r.ThresholdLevel
            ORDER BY r.AvailableQuantity ASC
        `);
        res.json({ count: result.recordset.length, resources: result.recordset });
}));

router.put('/consume/:id', verifyToken, checkRole([1,3,4]), asyncHandler(async (req, res) => {
    const allocationID = toInt(req.params.id);
    const consumedQuantity = toInt(req.body.consumedQuantity);
    if (!allocationID || consumedQuantity === null) {
        return res.status(400).json({ error: 'allocationID and consumedQuantity are required.' });
    }

    const pool = await getPool();
    await pool.request()
        .input('AllocationID', sql.Int, allocationID)
        .input('ConsumedQuantity', sql.Int, consumedQuantity)
        .input('CurrentUserID', sql.Int, req.user.userID)
        .execute('sp_UpdateConsumedResources');

    res.json({ message: 'Consumed resources updated.' });
}));

module.exports = router;
