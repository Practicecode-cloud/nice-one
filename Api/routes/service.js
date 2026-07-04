const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================================================
   GET ALL SERVICES
=================================================== */

router.get('/', async (req, res) => {
  try {
    const services = await pool.query(
      'SELECT * FROM Service ORDER BY service_id',
    );

    res.json(services.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   GET SERVICE BY ID
=================================================== */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await pool.query(
      'SELECT * FROM Service WHERE service_id=$1',
      [id],
    );

    if (service.rows.length === 0) {
      return res.status(404).json({
        message: 'Service not found',
      });
    }

    res.json(service.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   CREATE SERVICE
=================================================== */

router.post('/', async (req, res) => {
  try {
    const { service_name, price, description } = req.body;

    const service = await pool.query(
      `INSERT INTO Service
            (
                service_name,
                price,
                description
            )

            VALUES($1,$2,$3)

            RETURNING *`,

      [service_name, price, description],
    );

    res.status(201).json({
      message: 'Service Created Successfully',
      service: service.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   UPDATE SERVICE
=================================================== */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { service_name, price, description } = req.body;

    const service = await pool.query(
      `UPDATE Service

            SET
                service_name=$1,
                price=$2,
                description=$3

            WHERE service_id=$4

            RETURNING *`,

      [service_name, price, description, id],
    );

    if (service.rows.length === 0) {
      return res.status(404).json({
        message: 'Service not found',
      });
    }

    res.json({
      message: 'Service Updated Successfully',
      service: service.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===================================================
   DELETE SERVICE
=================================================== */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await pool.query(
      'DELETE FROM Service WHERE service_id=$1 RETURNING *',

      [id],
    );

    if (service.rows.length === 0) {
      return res.status(404).json({
        message: 'Service not found',
      });
    }

    res.json({
      message: 'Service Deleted Successfully',
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
