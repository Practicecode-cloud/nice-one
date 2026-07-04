const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL EMPLOYEES
=================================================== */

router.get('/', async (req, res) => {
  try {
    const employees = await pool.query(`

            SELECT
                e.*,
                d.department_name,
                b.branch_name

            FROM Employee e

            JOIN Department d
                ON e.department_id = d.department_id

            JOIN Branch b
                ON e.branch_id = b.branch_id

            ORDER BY e.employee_id

        `);

    res.json(employees.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET EMPLOYEE BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await pool.query(
      `

            SELECT
                e.*,
                d.department_name,
                b.branch_name

            FROM Employee e

            JOIN Department d
                ON e.department_id = d.department_id

            JOIN Branch b
                ON e.branch_id = b.branch_id

            WHERE e.employee_id = $1

        `,
      [id],
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({
        message: 'Employee not found',
      });
    }

    res.json(employee.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE EMPLOYEE
=================================================== */

router.post('/', async (req, res) => {
  try {
    const {
      department_id,
      branch_id,
      first_name,
      last_name,
      designation,
      phone,
      email,
      salary,
      hire_date,
      shift,
      status,
    } = req.body;

    const department = await pool.query(
      'SELECT * FROM Department WHERE department_id=$1',
      [department_id],
    );

    if (department.rows.length === 0) {
      return res.status(404).json({
        message: 'Department not found',
      });
    }

    const branch = await pool.query('SELECT * FROM Branch WHERE branch_id=$1', [
      branch_id,
    ]);

    if (branch.rows.length === 0) {
      return res.status(404).json({
        message: 'Branch not found',
      });
    }

    const employee = await pool.query(
      `INSERT INTO Employee
            (
                department_id,
                branch_id,
                first_name,
                last_name,
                designation,
                phone,
                email,
                salary,
                hire_date,
                shift,
                status
            )

            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)

            RETURNING *`,

      [
        department_id,
        branch_id,
        first_name,
        last_name,
        designation,
        phone,
        email,
        salary,
        hire_date,
        shift,
        status,
      ],
    );

    res.status(201).json({
      message: 'Employee Created Successfully',
      employee: employee.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE EMPLOYEE
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      department_id,
      branch_id,
      first_name,
      last_name,
      designation,
      phone,
      email,
      salary,
      hire_date,
      shift,
      status,
    } = req.body;

    const department = await pool.query(
      'SELECT * FROM Department WHERE department_id=$1',
      [department_id],
    );

    if (department.rows.length === 0) {
      return res.status(404).json({
        message: 'Department not found',
      });
    }

    const branch = await pool.query('SELECT * FROM Branch WHERE branch_id=$1', [
      branch_id,
    ]);

    if (branch.rows.length === 0) {
      return res.status(404).json({
        message: 'Branch not found',
      });
    }

    const employee = await pool.query(
      `UPDATE Employee

            SET
                department_id=$1,
                branch_id=$2,
                first_name=$3,
                last_name=$4,
                designation=$5,
                phone=$6,
                email=$7,
                salary=$8,
                hire_date=$9,
                shift=$10,
                status=$11

            WHERE employee_id=$12

            RETURNING *`,

      [
        department_id,
        branch_id,
        first_name,
        last_name,
        designation,
        phone,
        email,
        salary,
        hire_date,
        shift,
        status,
        id,
      ],
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({
        message: 'Employee not found',
      });
    }

    res.json({
      message: 'Employee Updated Successfully',
      employee: employee.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE EMPLOYEE
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await pool.query(
      'DELETE FROM Employee WHERE employee_id=$1 RETURNING *',

      [id],
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({
        message: 'Employee not found',
      });
    }

    res.json({
      message: 'Employee Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
