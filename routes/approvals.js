const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/rbac');
const { asyncHandler, toInt } = require('../utils/routeHelpers');

// GET /api/approvals/pending - Get pending approvals for user's role
// Roles: Admin(1), Warehouse Manager(4), Finance Officer(5)
router.get('/pending', verifyToken, checkRole([1,4,5]), asyncHandler(async (req, res) => {
        const pool = await getPool();
        const result = await pool.request()
            .input('RoleID', sql.Int, req.user.roleID)
            .execute('sp_GetPendingApprovalsByRole');

        res.json({ count: result.recordset.length, approvals: result.recordset });
}));

// POST /api/approvals/process - Approve or reject
// Roles: Admin(1), Warehouse Manager(4), Finance Officer(5)
router.post('/process', verifyToken, checkRole([1,4,5]), asyncHandler(async (req, res) => {
        const { approvalID, action, remarks, budgetID } = req.body;

        if (!approvalID || !action) {
            return res.status(400).json({ error: 'approvalID and action are required.' });
        }
        if (!['Approve','Reject'].includes(action)) {
            return res.status(400).json({ error: 'action must be Approve or Reject.' });
        }

        const pool = await getPool();
        const approval = await pool.request()
            .input('ApprovalID', sql.Int, approvalID)
            .query('SELECT * FROM Approval WHERE ApprovalID = @ApprovalID');
        const row = approval.recordset[0];

        if (!row) {
            return res.status(404).json({ error: 'Approval not found.' });
        }

        if (action === 'Approve' && row.RequestType === 'Financial') {
            const selectedBudgetID = toInt(budgetID);
            if (!selectedBudgetID) {
                return res.status(400).json({ error: 'budgetID is required to approve financial expenses.' });
            }
            await pool.request()
                .input('TransactionID', sql.Int, row.ReferenceID)
                .input('ApproverUserID', sql.Int, req.user.userID)
                .input('BudgetID', sql.Int, selectedBudgetID)
                .input('Remarks', sql.VarChar(sql.MAX), remarks || null)
                .execute('sp_ApproveExpense');
        } else {
            await pool.request()
                .input('ApprovalID', sql.Int, approvalID)
                .input('Action', sql.VarChar(10), action)
                .input('ApproverUserID', sql.Int, req.user.userID)
                .input('Remarks', sql.VarChar(sql.MAX), remarks || null)
                .execute('sp_ProcessApproval');
        }

        res.json({ message: `Approval ${action}d successfully!` });
}));

router.get('/history', verifyToken, checkRole([1,4,5]), asyncHandler(async (req, res) => {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT a.*, requester.FullName AS RequestedByName, approver.FullName AS ApprovedByName
        FROM Approval a
        LEFT JOIN Users requester ON a.RequestedByUserID = requester.UserID
        LEFT JOIN Users approver ON a.ApprovedByUserID = approver.UserID
        ORDER BY a.RequestedAt DESC
    `);
    res.json({ count: result.recordset.length, approvals: result.recordset });
}));

module.exports = router;
