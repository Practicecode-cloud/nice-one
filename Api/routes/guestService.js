const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL GUEST SERVICES
=================================================== */

router.get('/', async (req, res) => {
  try {
    const guestServices = await pool.query(`

            SELECT
                gs.*,
                s.service_name,
                r.reservation_id,
                rm.room_number,
                g.first_name,
                g.last_name

            FROM GuestService gs

            JOIN Reservation r
                ON gs.reservation_id = r.reservation_id

            JOIN Guest g
                ON r.guest_id = g.guest_id

            JOIN Room rm
                ON r.room_id = rm.room_id

            JOIN Service s
                ON gs.service_id = s.service_id

            ORDER BY gs.guest_service_id

        `);

    res.json(guestServices.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET GUEST SERVICE BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const guestService = await pool.query(
      `

            SELECT
                gs.*,
                s.service_name,
                r.reservation_id,
                rm.room_number,
                g.first_name,
                g.last_name

            FROM GuestService gs

            JOIN Reservation r
                ON gs.reservation_id = r.reservation_id

            JOIN Guest g
                ON r.guest_id = g.guest_id

            JOIN Room rm
                ON r.room_id = rm.room_id

            JOIN Service s
                ON gs.service_id = s.service_id

            WHERE gs.guest_service_id=$1

        `,
      [id],
    );

    if (guestService.rows.length === 0) {
      return res.status(404).json({
        message: 'Guest Service not found',
      });
    }

    res.json(guestService.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE GUEST SERVICE
=================================================== */

router.post('/', async (req, res) => {
  try {
    const { reservation_id, service_id, quantity, total_price, service_date } =
      req.body;

    const reservation = await pool.query(
      'SELECT * FROM Reservation WHERE reservation_id=$1',
      [reservation_id],
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({
        message: 'Reservation not found',
      });
    }

    const service = await pool.query(
      'SELECT * FROM Service WHERE service_id=$1',
      [service_id],
    );

    if (service.rows.length === 0) {
      return res.status(404).json({
        message: 'Service not found',
      });
    }

    const guestService = await pool.query(
      `INSERT INTO GuestService
            (
                reservation_id,
                service_id,
                quantity,
                total_price,
                service_date
            )

            VALUES($1,$2,$3,$4,$5)

            RETURNING *`,

      [reservation_id, service_id, quantity, total_price, service_date],
    );

    res.status(201).json({
      message: 'Guest Service Created Successfully',
      guestService: guestService.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE GUEST SERVICE
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { reservation_id, service_id, quantity, total_price, service_date } =
      req.body;

    const reservation = await pool.query(
      'SELECT * FROM Reservation WHERE reservation_id=$1',
      [reservation_id],
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({
        message: 'Reservation not found',
      });
    }

    const service = await pool.query(
      'SELECT * FROM Service WHERE service_id=$1',
      [service_id],
    );

    if (service.rows.length === 0) {
      return res.status(404).json({
        message: 'Service not found',
      });
    }

    const guestService = await pool.query(
      `UPDATE GuestService

            SET
                reservation_id=$1,
                service_id=$2,
                quantity=$3,
                total_price=$4,
                service_date=$5

            WHERE guest_service_id=$6

            RETURNING *`,

      [reservation_id, service_id, quantity, total_price, service_date, id],
    );

    if (guestService.rows.length === 0) {
      return res.status(404).json({
        message: 'Guest Service not found',
      });
    }

    res.json({
      message: 'Guest Service Updated Successfully',
      guestService: guestService.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE GUEST SERVICE
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const guestService = await pool.query(
      'DELETE FROM GuestService WHERE guest_service_id=$1 RETURNING *',

      [id],
    );

    if (guestService.rows.length === 0) {
      return res.status(404).json({
        message: 'Guest Service not found',
      });
    }

    res.json({
      message: 'Guest Service Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
