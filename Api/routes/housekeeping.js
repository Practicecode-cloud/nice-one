const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL HOUSEKEEPING RECORDS
=================================================== */

router.get('/', async (req, res) => {
  try {
    const data = await pool.query(`

            SELECT
                h.*,
                r.room_number,
                e.first_name AS employee_first_name,
                e.last_name AS employee_last_name

            FROM Housekeeping h

            JOIN Room r
                ON h.room_id = r.room_id

            JOIN Employee e
                ON h.employee_id = e.employee_id

            ORDER BY h.housekeeping_id

        `);

    res.json(data.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const data = await pool.query(
      `

            SELECT
                h.*,
                r.room_number,
                e.first_name AS employee_first_name,
                e.last_name AS employee_last_name

            FROM Housekeeping h

            JOIN Room r
                ON h.room_id = r.room_id

            JOIN Employee e
                ON h.employee_id = e.employee_id

            WHERE h.housekeeping_id = $1

        `,
      [id],
    );

    if (data.rows.length === 0) {
      return res.status(404).json({
        message: 'Housekeeping record not found',
      });
    }

    res.json(data.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE HOUSEKEEPING RECORD
=================================================== */

router.post('/', async (req, res) => {
  try {
    const { room_id, employee_id, cleaning_date, cleaning_status, remarks } =
      req.body;

    const room = await pool.query('SELECT * FROM Room WHERE room_id=$1', [
      room_id,
    ]);

    if (room.rows.length === 0) {
      return res.status(404).json({
        message: 'Room not found',
      });
    }

    const employee = await pool.query(
      'SELECT * FROM Employee WHERE employee_id=$1',
      [employee_id],
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({
        message: 'Employee not found',
      });
    }

    const result = await pool.query(
      `

            INSERT INTO Housekeeping
            (
                room_id,
                employee_id,
                cleaning_date,
                cleaning_status,
                remarks
            )

            VALUES($1,$2,$3,$4,$5)

            RETURNING *

        `,
      [room_id, employee_id, cleaning_date, cleaning_status, remarks],
    );

    res.status(201).json({
      message: 'Housekeeping record created successfully',
      housekeeping: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE HOUSEKEEPING
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { room_id, employee_id, cleaning_date, cleaning_status, remarks } =
      req.body;

    const room = await pool.query('SELECT * FROM Room WHERE room_id=$1', [
      room_id,
    ]);

    if (room.rows.length === 0) {
      return res.status(404).json({
        message: 'Room not found',
      });
    }

    const employee = await pool.query(
      'SELECT * FROM Employee WHERE employee_id=$1',
      [employee_id],
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({
        message: 'Employee not found',
      });
    }

    const result = await pool.query(
      `

            UPDATE Housekeeping

            SET
                room_id=$1,
                employee_id=$2,
                cleaning_date=$3,
                cleaning_status=$4,
                remarks=$5

            WHERE housekeeping_id=$6

            RETURNING *

        `,
      [room_id, employee_id, cleaning_date, cleaning_status, remarks, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Housekeeping record not found',
      });
    }

    res.json({
      message: 'Housekeeping updated successfully',
      housekeeping: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE HOUSEKEEPING
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM Housekeeping WHERE housekeeping_id=$1 RETURNING *',
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Housekeeping record not found',
      });
    }

    res.json({
      message: 'Housekeeping deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
