const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL CHECK-OUTS
=================================================== */

router.get('/', async (req, res) => {
  try {
    const checkouts = await pool.query(`

            SELECT
                co.*,
                ci.checkin_time,
                r.check_in,
                r.check_out,
                rm.room_number,
                g.first_name,
                g.last_name

            FROM CheckOut co

            JOIN CheckIn ci
                ON co.checkin_id = ci.checkin_id

            JOIN Reservation r
                ON ci.reservation_id = r.reservation_id

            JOIN Guest g
                ON r.guest_id = g.guest_id

            JOIN Room rm
                ON r.room_id = rm.room_id

            ORDER BY co.checkout_id

        `);

    res.json(checkouts.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET CHECK-OUT BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkout = await pool.query(
      `

            SELECT
                co.*,
                ci.checkin_time,
                r.check_in,
                r.check_out,
                rm.room_number,
                g.first_name,
                g.last_name

            FROM CheckOut co

            JOIN CheckIn ci
                ON co.checkin_id = ci.checkin_id

            JOIN Reservation r
                ON ci.reservation_id = r.reservation_id

            JOIN Guest g
                ON r.guest_id = g.guest_id

            JOIN Room rm
                ON r.room_id = rm.room_id

            WHERE co.checkout_id=$1

        `,
      [id],
    );

    if (checkout.rows.length === 0) {
      return res.status(404).json({
        message: 'Check-Out not found',
      });
    }

    res.json(checkout.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE CHECK-OUT
=================================================== */

router.post('/', async (req, res) => {
  try {
    const { checkin_id, checkout_time, extra_charges, remarks } = req.body;

    const checkin = await pool.query(
      'SELECT * FROM CheckIn WHERE checkin_id=$1',
      [checkin_id],
    );

    if (checkin.rows.length === 0) {
      return res.status(404).json({
        message: 'Check-In not found',
      });
    }

    const existing = await pool.query(
      'SELECT * FROM CheckOut WHERE checkin_id=$1',
      [checkin_id],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: 'Check-Out already exists for this Check-In.',
      });
    }

    const checkout = await pool.query(
      `INSERT INTO CheckOut
            (
                checkin_id,
                checkout_time,
                extra_charges,
                remarks
            )

            VALUES($1,$2,$3,$4)

            RETURNING *`,

      [checkin_id, checkout_time, extra_charges, remarks],
    );

    res.status(201).json({
      message: 'Check-Out Created Successfully',
      checkout: checkout.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE CHECK-OUT
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { checkin_id, checkout_time, extra_charges, remarks } = req.body;

    const checkin = await pool.query(
      'SELECT * FROM CheckIn WHERE checkin_id=$1',
      [checkin_id],
    );

    if (checkin.rows.length === 0) {
      return res.status(404).json({
        message: 'Check-In not found',
      });
    }

    const checkout = await pool.query(
      `UPDATE CheckOut

            SET
                checkin_id=$1,
                checkout_time=$2,
                extra_charges=$3,
                remarks=$4

            WHERE checkout_id=$5

            RETURNING *`,

      [checkin_id, checkout_time, extra_charges, remarks, id],
    );

    if (checkout.rows.length === 0) {
      return res.status(404).json({
        message: 'Check-Out not found',
      });
    }

    res.json({
      message: 'Check-Out Updated Successfully',
      checkout: checkout.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE CHECK-OUT
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkout = await pool.query(
      'DELETE FROM CheckOut WHERE checkout_id=$1 RETURNING *',

      [id],
    );

    if (checkout.rows.length === 0) {
      return res.status(404).json({
        message: 'Check-Out not found',
      });
    }

    res.json({
      message: 'Check-Out Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
