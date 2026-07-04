const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/hotels', require('./routes/hotel'));
app.use('/api/branches', require('./routes/branch'));
app.use('/api/roomtypes', require('./routes/roomType'));
app.use('/api/rooms', require('./routes/room'));
app.use('/api/guests', require('./routes/guest'));
app.use('/api/reservation', require('./routes/reservation'));
app.use('/api/checkins', require('./routes/checkin'));
app.use('/api/checkouts', require('./routes/checkout'));
app.use('/api/departments', require('./routes/department'));
app.use('/api/employees', require('./routes/employee'));
app.use('/api/services', require('./routes/service'));
app.use('/api/guestservices', require('./routes/guestService'));
app.use('/api/bills', require('./routes/bill'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/housekeeping', require('./routes/housekeeping'));
app.use('/api/maintenance', require('./routes/maintenance'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
