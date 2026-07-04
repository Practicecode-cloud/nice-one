const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL HOTELS
=================================================== */

router.get('/', async (req, res) => {
  try {
    const hotels = await pool.query('SELECT * FROM Hotel ORDER BY hotel_id');

    res.json(hotels.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================
   GET HOTEL BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await pool.query('SELECT * FROM Hotel WHERE hotel_id=$1', [
      id,
    ]);

    if (hotel.rows.length === 0) {
      return res.status(404).json({
        message: 'Hotel not found',
      });
    }

    res.json(hotel.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================
   CREATE HOTEL
=================================================== */

router.post('/', async (req, res) => {
  try {
    const { name, address, contact_no, email } = req.body;

    const hotel = await pool.query(
      `INSERT INTO Hotel
            (name,address,contact_no,email)

            VALUES($1,$2,$3,$4)

            RETURNING *`,

      [name, address, contact_no, email],
    );

    res.status(201).json({
      message: 'Hotel Created Successfully',
      hotel: hotel.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================
   UPDATE HOTEL
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { name, address, contact_no, email } = req.body;

    const hotel = await pool.query(
      `UPDATE Hotel

            SET
            name=$1,
            address=$2,
            contact_no=$3,
            email=$4

            WHERE hotel_id=$5

            RETURNING *`,

      [name, address, contact_no, email, id],
    );

    if (hotel.rows.length === 0) {
      return res.status(404).json({
        message: 'Hotel not found',
      });
    }

    res.json({
      message: 'Hotel Updated Successfully',
      hotel: hotel.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================
   DELETE HOTEL
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await pool.query(
      'DELETE FROM Hotel WHERE hotel_id=$1 RETURNING *',
      [id],
    );

    if (hotel.rows.length === 0) {
      return res.status(404).json({
        message: 'Hotel not found',
      });
    }

    res.json({
      message: 'Hotel Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
