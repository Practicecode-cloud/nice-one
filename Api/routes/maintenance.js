const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL MAINTENANCE RECORDS
=================================================== */

router.get('/', async (req, res) => {
  try {
    const data = await pool.query(`

            SELECT
                m.*,
                r.room_number,
                e.first_name AS employee_first_name,
                e.last_name AS employee_last_name

            FROM Maintenance m

            LEFT JOIN Room r
                ON m.room_id = r.room_id

            LEFT JOIN Employee e
                ON m.employee_id = e.employee_id

            ORDER BY m.maintenance_id

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
                m.*,
                r.room_number,
                e.first_name AS employee_first_name,
                e.last_name AS employee_last_name

            FROM Maintenance m

            LEFT JOIN Room r
                ON m.room_id = r.room_id

            LEFT JOIN Employee e
                ON m.employee_id = e.employee_id

            WHERE m.maintenance_id = $1

        `,
      [id],
    );

    if (data.rows.length === 0) {
      return res.status(404).json({
        message: 'Maintenance record not found',
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
   CREATE MAINTENANCE RECORD
=================================================== */

router.post('/', async (req, res) => {
  try {
    const {
      room_id,
      employee_id,
      issue_description,
      reported_date,
      resolved_date,
      maintenance_status,
    } = req.body;

    const room = await pool.query('SELECT * FROM Room WHERE room_id=$1', [
      room_id,
    ]);

    if (room.rows.length === 0) {
      return res.status(404).json({
        message: 'Room not found',
      });
    }

    // employee is optional in schema (can be NULL)
    if (employee_id) {
      const employee = await pool.query(
        'SELECT * FROM Employee WHERE employee_id=$1',
        [employee_id],
      );

      if (employee.rows.length === 0) {
        return res.status(404).json({
          message: 'Employee not found',
        });
      }
    }

    const result = await pool.query(
      `

            INSERT INTO Maintenance
            (
                room_id,
                employee_id,
                issue_description,
                reported_date,
                resolved_date,
                maintenance_status
            )

            VALUES($1,$2,$3,$4,$5,$6)

            RETURNING *

        `,
      [
        room_id,
        employee_id || null,
        issue_description,
        reported_date,
        resolved_date,
        maintenance_status,
      ],
    );

    res.status(201).json({
      message: 'Maintenance record created successfully',
      maintenance: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE MAINTENANCE
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      room_id,
      employee_id,
      issue_description,
      reported_date,
      resolved_date,
      maintenance_status,
    } = req.body;

    const room = await pool.query('SELECT * FROM Room WHERE room_id=$1', [
      room_id,
    ]);

    if (room.rows.length === 0) {
      return res.status(404).json({
        message: 'Room not found',
      });
    }

    if (employee_id) {
      const employee = await pool.query(
        'SELECT * FROM Employee WHERE employee_id=$1',
        [employee_id],
      );

      if (employee.rows.length === 0) {
        return res.status(404).json({
          message: 'Employee not found',
        });
      }
    }

    const result = await pool.query(
      `

            UPDATE Maintenance

            SET
                room_id=$1,
                employee_id=$2,
                issue_description=$3,
                reported_date=$4,
                resolved_date=$5,
                maintenance_status=$6

            WHERE maintenance_id=$7

            RETURNING *

        `,
      [
        room_id,
        employee_id || null,
        issue_description,
        reported_date,
        resolved_date,
        maintenance_status,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Maintenance record not found',
      });
    }

    res.json({
      message: 'Maintenance updated successfully',
      maintenance: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE MAINTENANCE
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM Maintenance WHERE maintenance_id=$1 RETURNING *',
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Maintenance record not found',
      });
    }

    res.json({
      message: 'Maintenance deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
