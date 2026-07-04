const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL ROOMS
=================================================== */

router.get('/', async (req, res) => {
  try {
    const rooms = await pool.query(`
            SELECT
                r.*,
                b.branch_name,
                rt.type_name
            FROM Room r
            JOIN Branch b
                ON r.branch_id = b.branch_id
            JOIN RoomType rt
                ON r.room_type_id = rt.room_type_id
            ORDER BY r.room_id
        `);

    res.json(rooms.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET ROOM BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const room = await pool.query(
      `
            SELECT
                r.*,
                b.branch_name,
                rt.type_name
            FROM Room r
            JOIN Branch b
                ON r.branch_id = b.branch_id
            JOIN RoomType rt
                ON r.room_type_id = rt.room_type_id
            WHERE r.room_id=$1
        `,
      [id],
    );

    if (room.rows.length === 0) {
      return res.status(404).json({
        message: 'Room not found',
      });
    }

    res.json(room.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE ROOM
=================================================== */

router.post('/', async (req, res) => {
  try {
    const { branch_id, room_type_id, room_number, floor_no, status } = req.body;

    const branch = await pool.query('SELECT * FROM Branch WHERE branch_id=$1', [
      branch_id,
    ]);

    if (branch.rows.length === 0) {
      return res.status(404).json({
        message: 'Branch not found',
      });
    }

    const roomType = await pool.query(
      'SELECT * FROM RoomType WHERE room_type_id=$1',
      [room_type_id],
    );

    if (roomType.rows.length === 0) {
      return res.status(404).json({
        message: 'Room Type not found',
      });
    }

    const room = await pool.query(
      `INSERT INTO Room
            (branch_id,room_type_id,room_number,floor_no,status)

            VALUES($1,$2,$3,$4,$5)

            RETURNING *`,

      [branch_id, room_type_id, room_number, floor_no, status],
    );

    res.status(201).json({
      message: 'Room Created Successfully',
      room: room.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE ROOM
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { branch_id, room_type_id, room_number, floor_no, status } = req.body;

    const branch = await pool.query('SELECT * FROM Branch WHERE branch_id=$1', [
      branch_id,
    ]);

    if (branch.rows.length === 0) {
      return res.status(404).json({
        message: 'Branch not found',
      });
    }

    const roomType = await pool.query(
      'SELECT * FROM RoomType WHERE room_type_id=$1',
      [room_type_id],
    );

    if (roomType.rows.length === 0) {
      return res.status(404).json({
        message: 'Room Type not found',
      });
    }

    const room = await pool.query(
      `UPDATE Room

            SET
            branch_id=$1,
            room_type_id=$2,
            room_number=$3,
            floor_no=$4,
            status=$5

            WHERE room_id=$6

            RETURNING *`,

      [branch_id, room_type_id, room_number, floor_no, status, id],
    );

    if (room.rows.length === 0) {
      return res.status(404).json({
        message: 'Room not found',
      });
    }

    res.json({
      message: 'Room Updated Successfully',
      room: room.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE ROOM
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const room = await pool.query(
      'DELETE FROM Room WHERE room_id=$1 RETURNING *',

      [id],
    );

    if (room.rows.length === 0) {
      return res.status(404).json({
        message: 'Room not found',
      });
    }

    res.json({
      message: 'Room Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
