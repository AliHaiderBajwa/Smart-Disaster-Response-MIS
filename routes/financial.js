const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/rbac');
const { asyncHandler, toNumber, toInt } = require('../utils/routeHelpers');

// POST /api/financial/transactions - Record a transaction
// Roles: Admin(1), Finance Officer(5)
router.post('/transactions', verifyToken, checkRole([1,5]), asyncHandler(async (req, res) => {
        const { type, amount, description, reportID } = req.body;

        if (!type || !amount || !reportID) {
            return res.status(400).json({ error: 'type, amount and reportID are required.' });
        }
        if (!['Donation','Expense','Procurement'].includes(type)) {
            return res.status(400).json({ error: 'type must be Donation, Expense or Procurement.' });
        }
        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0.' });
        }

        const pool = await getPool();
        let transactionID = null;

        if (type === 'Donation') {
            await pool.request()
                .input('Amount', sql.Decimal(12,2), amount)
                .input('Description', sql.VarChar(sql.MAX), description || '')
                .input('ReportID', sql.Int, reportID)
                .input('UserID', sql.Int, req.user.userID)
                .execute('sp_RecordDonation');
        } else if (type === 'Expense') {
            const result = await pool.request()
                .input('Amount', sql.Decimal(12,2), amount)
                .input('Description', sql.VarChar(sql.MAX), description || '')
                .input('ReportID', sql.Int, reportID)
                .input('DisasterType', sql.VarChar(50), req.body.disasterType || null)
                .input('UserID', sql.Int, req.user.userID)
                .output('TransactionID', sql.Int)
                .execute('sp_RecordExpense');
            transactionID = result.output.TransactionID;
        } else {
            const result = await pool.request()
                .input('Type', sql.VarChar(20), type)
                .input('Amount', sql.Decimal(12,2), amount)
                .input('Description', sql.VarChar(sql.MAX), description || '')
                .input('ReportID', sql.Int, reportID)
                .input('UserID', sql.Int, req.user.userID)
                .query(`
                    INSERT INTO FinancialTransaction (Type, Amount, Description, ReportID, UserID, Timestamp)
                    OUTPUT INSERTED.TransactionID
                    VALUES (@Type, @Amount, @Description, @ReportID, @UserID, GETDATE())
                `);
            transactionID = result.recordset[0]?.TransactionID;
        }

        res.status(201).json({
            message: type === 'Expense' 
                ? 'Expense recorded and sent for approval!' 
                : 'Transaction recorded successfully!',
            transactionID
        });
}));

router.get('/transactions', verifyToken, checkRole([1,5]), asyncHandler(async (req, res) => {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM vw_FinanceView ORDER BY Timestamp DESC');
    res.json({ count: result.recordset.length, transactions: result.recordset });
}));

// GET /api/financial/summary - Get financial summary
// Roles: Admin(1), Finance Officer(5)
router.get('/summary', verifyToken, checkRole([1,5]), asyncHandler(async (req, res) => {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM vw_FinancialSummary ORDER BY DisasterType');

        res.json({ summary: result.recordset });
}));

// GET /api/financial/budget - Get budget by disaster event
// Roles: Admin(1), Finance Officer(5)
router.get('/budget', verifyToken, checkRole([1,5]), asyncHandler(async (req, res) => {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM BudgetTracking ORDER BY FiscalYear DESC, DisasterType');
        res.json({ budget: result.recordset });
}));

router.post('/approve-expense', verifyToken, checkRole([1,5]), asyncHandler(async (req, res) => {
    const transactionID = toInt(req.body.transactionID);
    const budgetID = toInt(req.body.budgetID);
    const remarks = req.body.remarks || null;

    if (!transactionID || !budgetID) {
        return res.status(400).json({ error: 'transactionID and budgetID are required.' });
    }

    const pool = await getPool();
    await pool.request()
        .input('TransactionID', sql.Int, transactionID)
        .input('ApproverUserID', sql.Int, req.user.userID)
        .input('BudgetID', sql.Int, budgetID)
        .input('Remarks', sql.VarChar(sql.MAX), remarks)
        .execute('sp_ApproveExpense');

    res.json({ message: 'Expense approved and budget updated.' });
}));

router.get('/audit', verifyToken, checkRole([1,5]), asyncHandler(async (req, res) => {
    const pool = await getPool();
    const result = await pool.request()
        .input('StartDate', sql.DateTime, req.query.startDate || null)
        .input('EndDate', sql.DateTime, req.query.endDate || null)
        .execute('sp_GenerateFinancialAuditTrail');
    res.json({ count: result.recordset.length, audit: result.recordset });
}));

module.exports = router;
