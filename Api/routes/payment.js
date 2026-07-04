const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL PAYMENTS
=================================================== */

router.get('/', async (req, res) => {
  try {
    const payments = await pool.query(`

            SELECT
                p.*,
                b.total_amount,
                b.bill_date,
                g.first_name,
                g.last_name,
                rm.room_number

            FROM Payment p

            JOIN Bill b
                ON p.bill_id = b.bill_id

            JOIN Reservation r
                ON b.reservation_id = r.reservation_id

            JOIN Guest g
                ON r.guest_id = g.guest_id

            JOIN Room rm
                ON r.room_id = rm.room_id

            ORDER BY p.payment_id

        `);

    res.json(payments.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET PAYMENT BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await pool.query(
      `

            SELECT
                p.*,
                b.total_amount,
                b.bill_date,
                g.first_name,
                g.last_name,
                rm.room_number

            FROM Payment p

            JOIN Bill b
                ON p.bill_id = b.bill_id

            JOIN Reservation r
                ON b.reservation_id = r.reservation_id

            JOIN Guest g
                ON r.guest_id = g.guest_id

            JOIN Room rm
                ON r.room_id = rm.room_id

            WHERE p.payment_id = $1

        `,
      [id],
    );

    if (payment.rows.length === 0) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    res.json(payment.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE PAYMENT
=================================================== */

router.post('/', async (req, res) => {
  try {
    const {
      bill_id,
      amount_paid,
      payment_method,
      payment_status,
      payment_date,
      transaction_reference,
    } = req.body;

    const bill = await pool.query('SELECT * FROM Bill WHERE bill_id = $1', [
      bill_id,
    ]);

    if (bill.rows.length === 0) {
      return res.status(404).json({
        message: 'Bill not found',
      });
    }

    const payment = await pool.query(
      `INSERT INTO Payment
            (
                bill_id,
                amount_paid,
                payment_method,
                payment_status,
                payment_date,
                transaction_reference
            )

            VALUES($1,$2,$3,$4,$5,$6)

            RETURNING *`,

      [
        bill_id,
        amount_paid,
        payment_method,
        payment_status,
        payment_date,
        transaction_reference,
      ],
    );

    res.status(201).json({
      message: 'Payment Created Successfully',
      payment: payment.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE PAYMENT
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      bill_id,
      amount_paid,
      payment_method,
      payment_status,
      payment_date,
      transaction_reference,
    } = req.body;

    const bill = await pool.query('SELECT * FROM Bill WHERE bill_id = $1', [
      bill_id,
    ]);

    if (bill.rows.length === 0) {
      return res.status(404).json({
        message: 'Bill not found',
      });
    }

    const payment = await pool.query(
      `UPDATE Payment

            SET
                bill_id=$1,
                amount_paid=$2,
                payment_method=$3,
                payment_status=$4,
                payment_date=$5,
                transaction_reference=$6

            WHERE payment_id=$7

            RETURNING *`,

      [
        bill_id,
        amount_paid,
        payment_method,
        payment_status,
        payment_date,
        transaction_reference,
        id,
      ],
    );

    if (payment.rows.length === 0) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    res.json({
      message: 'Payment Updated Successfully',
      payment: payment.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE PAYMENT
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await pool.query(
      'DELETE FROM Payment WHERE payment_id=$1 RETURNING *',

      [id],
    );

    if (payment.rows.length === 0) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    res.json({
      message: 'Payment Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
