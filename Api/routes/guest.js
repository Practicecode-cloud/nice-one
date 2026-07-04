const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL GUESTS
=================================================== */

router.get('/', async (req, res) => {
  try {
    const guests = await pool.query('SELECT * FROM Guest ORDER BY guest_id');

    res.json(guests.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET GUEST BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const guest = await pool.query('SELECT * FROM Guest WHERE guest_id=$1', [
      id,
    ]);

    if (guest.rows.length === 0) {
      return res.status(404).json({
        message: 'Guest not found',
      });
    }

    res.json(guest.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE GUEST
=================================================== */

router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      email,
      address,
      nationality,
      id_number,
    } = req.body;

    const guest = await pool.query(
      `INSERT INTO Guest
            (first_name,last_name,phone,email,address,nationality,id_number)

            VALUES($1,$2,$3,$4,$5,$6,$7)

            RETURNING *`,

      [first_name, last_name, phone, email, address, nationality, id_number],
    );

    res.status(201).json({
      message: 'Guest Created Successfully',
      guest: guest.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE GUEST
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      first_name,
      last_name,
      phone,
      email,
      address,
      nationality,
      id_number,
    } = req.body;

    const guest = await pool.query(
      `UPDATE Guest

            SET
            first_name=$1,
            last_name=$2,
            phone=$3,
            email=$4,
            address=$5,
            nationality=$6,
            id_number=$7

            WHERE guest_id=$8

            RETURNING *`,

      [
        first_name,
        last_name,
        phone,
        email,
        address,
        nationality,
        id_number,
        id,
      ],
    );

    if (guest.rows.length === 0) {
      return res.status(404).json({
        message: 'Guest not found',
      });
    }

    res.json({
      message: 'Guest Updated Successfully',
      guest: guest.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE GUEST
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const guest = await pool.query(
      'DELETE FROM Guest WHERE guest_id=$1 RETURNING *',

      [id],
    );

    if (guest.rows.length === 0) {
      return res.status(404).json({
        message: 'Guest not found',
      });
    }

    res.json({
      message: 'Guest Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
