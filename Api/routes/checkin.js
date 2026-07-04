const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL CHECK-INS
=================================================== */

router.get('/', async (req, res) => {
  try {
    const checkins = await pool.query(`

            SELECT
                c.*,
                r.check_in,
                r.check_out,
                rm.room_number,
                g.first_name,
                g.last_name

            FROM CheckIn c

            JOIN Reservation r
            ON c.reservation_id = r.reservation_id

            JOIN Guest g
            ON r.guest_id = g.guest_id

            JOIN Room rm
            ON r.room_id = rm.room_id

            ORDER BY c.checkin_id

        `);

    res.json(checkins.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET CHECK-IN BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkin = await pool.query(
      `

            SELECT
                c.*,
                r.check_in,
                r.check_out,
                rm.room_number,
                g.first_name,
                g.last_name

            FROM CheckIn c

            JOIN Reservation r
            ON c.reservation_id = r.reservation_id

            JOIN Guest g
            ON r.guest_id = g.guest_id

            JOIN Room rm
            ON r.room_id = rm.room_id

            WHERE c.checkin_id=$1

        `,
      [id],
    );

    if (checkin.rows.length === 0) {
      return res.status(404).json({
        message: 'Check-In not found',
      });
    }

    res.json(checkin.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE CHECK-IN
=================================================== */

router.post('/', async (req, res) => {
  try {
    const { reservation_id, checkin_time, expected_checkout } = req.body;

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
      'SELECT * FROM CheckIn WHERE reservation_id=$1',
      [reservation_id],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: 'Reservation already checked in.',
      });
    }

    const checkin = await pool.query(
      `INSERT INTO CheckIn
            (
                reservation_id,
                checkin_time,
                expected_checkout
            )

            VALUES($1,$2,$3)

            RETURNING *`,

      [reservation_id, checkin_time, expected_checkout],
    );

    res.status(201).json({
      message: 'Check-In Created Successfully',
      checkin: checkin.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE CHECK-IN
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { reservation_id, checkin_time, expected_checkout } = req.body;

    const reservation = await pool.query(
      'SELECT * FROM Reservation WHERE reservation_id=$1',
      [reservation_id],
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({
        message: 'Reservation not found',
      });
    }

    const checkin = await pool.query(
      `UPDATE CheckIn

            SET
                reservation_id=$1,
                checkin_time=$2,
                expected_checkout=$3

            WHERE checkin_id=$4

            RETURNING *`,

      [reservation_id, checkin_time, expected_checkout, id],
    );

    if (checkin.rows.length === 0) {
      return res.status(404).json({
        message: 'Check-In not found',
      });
    }

    res.json({
      message: 'Check-In Updated Successfully',
      checkin: checkin.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE CHECK-IN
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const checkin = await pool.query(
      'DELETE FROM CheckIn WHERE checkin_id=$1 RETURNING *',

      [id],
    );

    if (checkin.rows.length === 0) {
      return res.status(404).json({
        message: 'Check-In not found',
      });
    }

    res.json({
      message: 'Check-In Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
