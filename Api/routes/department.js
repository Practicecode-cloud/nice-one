const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL DEPARTMENTS
=================================================== */

router.get('/', async (req, res) => {
  try {
    const departments = await pool.query(
      'SELECT * FROM Department ORDER BY department_id',
    );

    res.json(departments.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET DEPARTMENT BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const department = await pool.query(
      'SELECT * FROM Department WHERE department_id=$1',
      [id],
    );

    if (department.rows.length === 0) {
      return res.status(404).json({
        message: 'Department not found',
      });
    }

    res.json(department.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE DEPARTMENT
=================================================== */

router.post('/', async (req, res) => {
  try {
    const { department_name, description } = req.body;

    const department = await pool.query(
      `INSERT INTO Department
            (
                department_name,
                description
            )

            VALUES($1,$2)

            RETURNING *`,

      [department_name, description],
    );

    res.status(201).json({
      message: 'Department Created Successfully',
      department: department.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE DEPARTMENT
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { department_name, description } = req.body;

    const department = await pool.query(
      `UPDATE Department

            SET
                department_name=$1,
                description=$2

            WHERE department_id=$3

            RETURNING *`,

      [department_name, description, id],
    );

    if (department.rows.length === 0) {
      return res.status(404).json({
        message: 'Department not found',
      });
    }

    res.json({
      message: 'Department Updated Successfully',
      department: department.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE DEPARTMENT
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const department = await pool.query(
      'DELETE FROM Department WHERE department_id=$1 RETURNING *',

      [id],
    );

    if (department.rows.length === 0) {
      return res.status(404).json({
        message: 'Department not found',
      });
    }

    res.json({
      message: 'Department Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
