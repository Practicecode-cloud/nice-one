const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL RESERVATIONS
=================================================== */

router.get('/', async (req, res) => {
  try {
    const reservations = await pool.query(`
            SELECT
                r.*,
                g.first_name,
                g.last_name,
                rm.room_number
            FROM Reservation r
            JOIN Guest g
                ON r.guest_id = g.guest_id
            JOIN Room rm
                ON r.room_id = rm.room_id
            ORDER BY r.reservation_id
        `);

    res.json(reservations.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET RESERVATION BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await pool.query(
      `
            SELECT
                r.*,
                g.first_name,
                g.last_name,
                rm.room_number
            FROM Reservation r
            JOIN Guest g
                ON r.guest_id = g.guest_id
            JOIN Room rm
                ON r.room_id = rm.room_id
            WHERE reservation_id = $1
        `,
      [id],
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({
        message: 'Reservation not found',
      });
    }

    res.json(reservation.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE RESERVATION
=================================================== */

router.post('/', async (req, res) => {
  try {
    const {
      guest_id,
      room_id,
      booking_date,
      check_in,
      check_out,
      adults,
      children,
      room_rate,
      total_nights,
      special_requests,
      reservation_status,
    } = req.body;

    const guest = await pool.query('SELECT * FROM Guest WHERE guest_id=$1', [
      guest_id,
    ]);

    if (guest.rows.length === 0) {
      return res.status(404).json({
        message: 'Guest not found',
      });
    }

    const room = await pool.query('SELECT * FROM Room WHERE room_id=$1', [
      room_id,
    ]);

    if (room.rows.length === 0) {
      return res.status(404).json({
        message: 'Room not found',
      });
    }

    const reservation = await pool.query(
      `INSERT INTO Reservation
            (
                guest_id,
                room_id,
                booking_date,
                check_in,
                check_out,
                adults,
                children,
                room_rate,
                total_nights,
                special_requests,
                reservation_status
            )

            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)

            RETURNING *`,

      [
        guest_id,
        room_id,
        booking_date,
        check_in,
        check_out,
        adults,
        children,
        room_rate,
        total_nights,
        special_requests,
        reservation_status,
      ],
    );

    res.status(201).json({
      message: 'Reservation Created Successfully',
      reservation: reservation.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE RESERVATION
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      guest_id,
      room_id,
      booking_date,
      check_in,
      check_out,
      adults,
      children,
      room_rate,
      total_nights,
      special_requests,
      reservation_status,
    } = req.body;

    const guest = await pool.query('SELECT * FROM Guest WHERE guest_id=$1', [
      guest_id,
    ]);

    if (guest.rows.length === 0) {
      return res.status(404).json({
        message: 'Guest not found',
      });
    }

    const room = await pool.query('SELECT * FROM Room WHERE room_id=$1', [
      room_id,
    ]);

    if (room.rows.length === 0) {
      return res.status(404).json({
        message: 'Room not found',
      });
    }

    const reservation = await pool.query(
      `UPDATE Reservation

            SET
            guest_id=$1,
            room_id=$2,
            booking_date=$3,
            check_in=$4,
            check_out=$5,
            adults=$6,
            children=$7,
            room_rate=$8,
            total_nights=$9,
            special_requests=$10,
            reservation_status=$11

            WHERE reservation_id=$12

            RETURNING *`,

      [
        guest_id,
        room_id,
        booking_date,
        check_in,
        check_out,
        adults,
        children,
        room_rate,
        total_nights,
        special_requests,
        reservation_status,
        id,
      ],
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({
        message: 'Reservation not found',
      });
    }

    res.json({
      message: 'Reservation Updated Successfully',
      reservation: reservation.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE RESERVATION
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await pool.query(
      'DELETE FROM Reservation WHERE reservation_id=$1 RETURNING *',

      [id],
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({
        message: 'Reservation not found',
      });
    }

    res.json({
      message: 'Reservation Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
