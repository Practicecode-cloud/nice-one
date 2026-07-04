const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL BILLS
=================================================== */

router.get('/', async (req, res) => {
  try {
    const bills = await pool.query(`

            SELECT
                b.*,
                g.first_name,
                g.last_name,
                rm.room_number

            FROM Bill b

            JOIN Reservation r
                ON b.reservation_id = r.reservation_id

            JOIN Guest g
                ON r.guest_id = g.guest_id

            JOIN Room rm
                ON r.room_id = rm.room_id

            ORDER BY b.bill_id

        `);

    res.json(bills.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET BILL BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await pool.query(
      `

            SELECT
                b.*,
                g.first_name,
                g.last_name,
                rm.room_number

            FROM Bill b

            JOIN Reservation r
                ON b.reservation_id = r.reservation_id

            JOIN Guest g
                ON r.guest_id = g.guest_id

            JOIN Room rm
                ON r.room_id = rm.room_id

            WHERE b.bill_id=$1

        `,
      [id],
    );

    if (bill.rows.length === 0) {
      return res.status(404).json({
        message: 'Bill not found',
      });
    }

    res.json(bill.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE BILL
=================================================== */

router.post('/', async (req, res) => {
  try {
    const {
      reservation_id,
      room_charges,
      service_charges,
      discount,
      tax,
      total_amount,
      bill_date,
    } = req.body;

    const reservation = await pool.query(
      'SELECT * FROM Reservation WHERE reservation_id=$1',
      [reservation_id],
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({
        message: 'Reservation not found',
      });
    }

    const existing = await pool.query(
      'SELECT * FROM Bill WHERE reservation_id=$1',
      [reservation_id],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: 'Bill already exists for this reservation.',
      });
    }

    const bill = await pool.query(
      `INSERT INTO Bill
            (
                reservation_id,
                room_charges,
                service_charges,
                discount,
                tax,
                total_amount,
                bill_date
            )

            VALUES($1,$2,$3,$4,$5,$6,$7)

            RETURNING *`,

      [
        reservation_id,
        room_charges,
        service_charges,
        discount,
        tax,
        total_amount,
        bill_date,
      ],
    );

    res.status(201).json({
      message: 'Bill Created Successfully',
      bill: bill.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE BILL
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      reservation_id,
      room_charges,
      service_charges,
      discount,
      tax,
      total_amount,
      bill_date,
    } = req.body;

    const reservation = await pool.query(
      'SELECT * FROM Reservation WHERE reservation_id=$1',
      [reservation_id],
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({
        message: 'Reservation not found',
      });
    }

    const bill = await pool.query(
      `UPDATE Bill

            SET
                reservation_id=$1,
                room_charges=$2,
                service_charges=$3,
                discount=$4,
                tax=$5,
                total_amount=$6,
                bill_date=$7

            WHERE bill_id=$8

            RETURNING *`,

      [
        reservation_id,
        room_charges,
        service_charges,
        discount,
        tax,
        total_amount,
        bill_date,
        id,
      ],
    );

    if (bill.rows.length === 0) {
      return res.status(404).json({
        message: 'Bill not found',
      });
    }

    res.json({
      message: 'Bill Updated Successfully',
      bill: bill.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE BILL
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await pool.query(
      'DELETE FROM Bill WHERE bill_id=$1 RETURNING *',

      [id],
    );

    if (bill.rows.length === 0) {
      return res.status(404).json({
        message: 'Bill not found',
      });
    }

    res.json({
      message: 'Bill Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
