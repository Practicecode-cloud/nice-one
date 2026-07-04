const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL ROOM TYPES
=================================================== */

router.get('/', async (req, res) => {
  try {
    const roomTypes = await pool.query(
      'SELECT * FROM RoomType ORDER BY room_type_id',
    );

    res.json(roomTypes.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET ROOM TYPE BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const roomType = await pool.query(
      'SELECT * FROM RoomType WHERE room_type_id=$1',
      [id],
    );

    if (roomType.rows.length === 0) {
      return res.status(404).json({
        message: 'Room Type not found',
      });
    }

    res.json(roomType.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE ROOM TYPE
=================================================== */

router.post('/', async (req, res) => {
  try {
    const { type_name, base_price, capacity, description } = req.body;

    const roomType = await pool.query(
      `INSERT INTO RoomType
            (type_name, base_price, capacity, description)

            VALUES($1,$2,$3,$4)

            RETURNING *`,

      [type_name, base_price, capacity, description],
    );

    res.status(201).json({
      message: 'Room Type Created Successfully',
      roomType: roomType.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE ROOM TYPE
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { type_name, base_price, capacity, description } = req.body;

    const roomType = await pool.query(
      `UPDATE RoomType

            SET
            type_name=$1,
            base_price=$2,
            capacity=$3,
            description=$4

            WHERE room_type_id=$5

            RETURNING *`,

      [type_name, base_price, capacity, description, id],
    );

    if (roomType.rows.length === 0) {
      return res.status(404).json({
        message: 'Room Type not found',
      });
    }

    res.json({
      message: 'Room Type Updated Successfully',
      roomType: roomType.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE ROOM TYPE
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const roomType = await pool.query(
      'DELETE FROM RoomType WHERE room_type_id=$1 RETURNING *',

      [id],
    );

    if (roomType.rows.length === 0) {
      return res.status(404).json({
        message: 'Room Type not found',
      });
    }

    res.json({
      message: 'Room Type Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
