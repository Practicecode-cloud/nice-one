const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL BRANCHES
=================================================== */

router.get('/', async (req, res) => {
  try {
    const branches = await pool.query(`
            SELECT
                b.*,
                h.name AS hotel_name
            FROM Branch b
            JOIN Hotel h
            ON b.hotel_id = h.hotel_id
            ORDER BY b.branch_id
        `);

    res.json(branches.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================
   GET BRANCH BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await pool.query(
      `
            SELECT
                b.*,
                h.name AS hotel_name
            FROM Branch b
            JOIN Hotel h
            ON b.hotel_id = h.hotel_id
            WHERE branch_id=$1
        `,
      [id],
    );

    if (branch.rows.length === 0) {
      return res.status(404).json({
        message: 'Branch not found',
      });
    }

    res.json(branch.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================
   CREATE BRANCH
=================================================== */

router.post('/', async (req, res) => {
  try {
    const { hotel_id, branch_name, location, contact_no } = req.body;

    // Check Hotel Exists
    const hotel = await pool.query('SELECT * FROM Hotel WHERE hotel_id=$1', [
      hotel_id,
    ]);

    if (hotel.rows.length === 0) {
      return res.status(404).json({
        message: 'Hotel not found',
      });
    }

    const branch = await pool.query(
      `INSERT INTO Branch
            (hotel_id,branch_name,location,contact_no)

            VALUES($1,$2,$3,$4)

            RETURNING *`,

      [hotel_id, branch_name, location, contact_no],
    );

    res.status(201).json({
      message: 'Branch Created Successfully',
      branch: branch.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE BRANCH
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { hotel_id, branch_name, location, contact_no } = req.body;

    // Check Hotel Exists
    const hotel = await pool.query('SELECT * FROM Hotel WHERE hotel_id=$1', [
      hotel_id,
    ]);

    if (hotel.rows.length === 0) {
      return res.status(404).json({
        message: 'Hotel not found',
      });
    }

    const branch = await pool.query(
      `UPDATE Branch

            SET
            hotel_id=$1,
            branch_name=$2,
            location=$3,
            contact_no=$4

            WHERE branch_id=$5

            RETURNING *`,

      [hotel_id, branch_name, location, contact_no, id],
    );

    if (branch.rows.length === 0) {
      return res.status(404).json({
        message: 'Branch not found',
      });
    }

    res.json({
      message: 'Branch Updated Successfully',
      branch: branch.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE BRANCH
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await pool.query(
      'DELETE FROM Branch WHERE branch_id=$1 RETURNING *',

      [id],
    );

    if (branch.rows.length === 0) {
      return res.status(404).json({
        message: 'Branch not found',
      });
    }

    res.json({
      message: 'Branch Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
