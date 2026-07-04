/* =========================================================================
   CONFIG.JS
   Central configuration for the Grand Aurelia Hotel Management System UI.
   -------------------------------------------------------------------------
   IMPORTANT: If your Node/Express backend runs on a different host or port,
   change API_BASE below. The backend must have CORS enabled (it already
   does via app.use(cors()) in server.js).
   ========================================================================= */

const API_BASE = (() => {
  const hostname = window.location.hostname;

  // Running inside a GitHub Codespace (e.g. served by the Live Server
  // extension on port 5500): the hostname looks like
  //   <codespace-name>-5500.app.github.dev
  // We swap the trailing "-<port>" for "-5000" so this works for ANY
  // codespace name, instead of a hardcoded one that breaks every time
  // a new/rebuilt codespace gets a different random name.
  if (hostname.includes("app.github.dev")) {
    const apiHost = hostname.replace(/-\d+(?=\.app\.github\.dev$)/, "-5000");
    return `https://${apiHost}/api`;
  }

  // Local development (opened directly, or via Live Server on localhost)
  return "http://localhost:5000/api";
})();

/* -------------------------------------------------------------------------
   MODULES
   One entry per database table / route. Each entry fully describes:
     - endpoint   : REST path segment under API_BASE
     - idKey      : primary key field name returned by the API
     - label      : human friendly plural name
     - icon       : emoji glyph used in nav + headers
     - group      : which horizontal nav dropdown this belongs to
     - fields     : form field definitions used to build Add/Edit modals
     - columns    : table column definitions used to build list views
     - image      : optional decorative seed image key for this module
   Field types supported: text, email, number, date, datetime-local,
   textarea, select (static options[] OR dynamic ref to another module)
   ------------------------------------------------------------------------- */

const MODULES = {

  hotels: {
    endpoint: 'hotels', idKey: 'hotel_id', label: 'Hotels', icon: '🏨',
    group: 'setup', order: 1,
    fields: [
      { name: 'name', label: 'Hotel Name', type: 'text', required: true, placeholder: 'e.g. Grand Aurelia' },
      { name: 'address', label: 'Address', type: 'text', required: true, placeholder: 'Street, City' },
      { name: 'contact_no', label: 'Contact No', type: 'text', required: true, placeholder: '+1 555 0100' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'reservations@hotel.com' },
    ],
    columns: [
      { key: 'hotel_id', label: 'ID', mono: true },
      { key: 'name', label: 'Hotel' },
      { key: 'address', label: 'Address' },
      { key: 'contact_no', label: 'Contact' },
      { key: 'email', label: 'Email' },
    ],
  },

  branches: {
    endpoint: 'branches', idKey: 'branch_id', label: 'Branches', icon: '🏢',
    group: 'setup', order: 2,
    fields: [
      { name: 'hotel_id', label: 'Hotel', type: 'select', ref: 'hotels', refLabel: r => r.name, required: true },
      { name: 'branch_name', label: 'Branch Name', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'contact_no', label: 'Contact No', type: 'text', required: true },
    ],
    columns: [
      { key: 'branch_id', label: 'ID', mono: true },
      { key: 'branch_name', label: 'Branch' },
      { key: 'hotel_name', label: 'Hotel' },
      { key: 'location', label: 'Location' },
      { key: 'contact_no', label: 'Contact' },
    ],
  },

  roomtypes: {
    endpoint: 'roomtypes', idKey: 'room_type_id', label: 'Room Types', icon: '🛏️',
    group: 'setup', order: 3,
    fields: [
      { name: 'type_name', label: 'Type Name', type: 'text', required: true, placeholder: 'Deluxe King' },
      { name: 'base_price', label: 'Base Price ($)', type: 'number', step: '0.01', required: true },
      { name: 'capacity', label: 'Capacity (guests)', type: 'number', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    columns: [
      { key: 'room_type_id', label: 'ID', mono: true },
      { key: 'type_name', label: 'Type' },
      { key: 'base_price', label: 'Base Price', format: 'currency', mono: true },
      { key: 'capacity', label: 'Capacity' },
      { key: 'description', label: 'Description' },
    ],
  },

  rooms: {
    endpoint: 'rooms', idKey: 'room_id', label: 'Rooms', icon: '🚪',
    group: 'setup', order: 4,
    fields: [
      { name: 'branch_id', label: 'Branch', type: 'select', ref: 'branches', refLabel: r => r.branch_name, required: true },
      { name: 'room_type_id', label: 'Room Type', type: 'select', ref: 'roomtypes', refLabel: r => r.type_name, required: true },
      { name: 'room_number', label: 'Room Number', type: 'text', required: true, placeholder: '204' },
      { name: 'floor_no', label: 'Floor No', type: 'number', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Available', 'Occupied', 'Maintenance', 'Cleaning'], required: true },
    ],
    columns: [
      { key: 'room_id', label: 'ID', mono: true },
      { key: 'room_number', label: 'Room #', mono: true },
      { key: 'type_name', label: 'Type' },
      { key: 'branch_name', label: 'Branch' },
      { key: 'floor_no', label: 'Floor' },
      { key: 'status', label: 'Status', badge: true },
    ],
    filterField: 'status',
  },

  guests: {
    endpoint: 'guests', idKey: 'guest_id', label: 'Guests', icon: '🧳',
    group: 'guests', order: 5,
    fields: [
      { name: 'first_name', label: 'First Name', type: 'text', required: true },
      { name: 'last_name', label: 'Last Name', type: 'text', required: true },
      { name: 'phone', label: 'Phone', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'nationality', label: 'Nationality', type: 'text' },
      { name: 'id_number', label: 'ID / Passport Number', type: 'text' },
    ],
    columns: [
      { key: 'guest_id', label: 'ID', mono: true },
      { key: 'first_name', label: 'First' },
      { key: 'last_name', label: 'Last' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'nationality', label: 'Nationality' },
    ],
  },

  reservation: {
    endpoint: 'reservation', idKey: 'reservation_id', label: 'Reservations', icon: '📅',
    group: 'guests', order: 6,
    fields: [
      { name: 'guest_id', label: 'Guest', type: 'select', ref: 'guests', refLabel: r => `${r.first_name} ${r.last_name}`, required: true },
      { name: 'room_id', label: 'Room', type: 'select', ref: 'rooms', refLabel: r => `Room ${r.room_number} · ${r.type_name}`, required: true },
      { name: 'booking_date', label: 'Booking Date', type: 'date', required: true },
      { name: 'check_in', label: 'Check-In Date', type: 'date', required: true },
      { name: 'check_out', label: 'Check-Out Date', type: 'date', required: true },
      { name: 'adults', label: 'Adults', type: 'number', required: true },
      { name: 'children', label: 'Children', type: 'number' },
      { name: 'room_rate', label: 'Room Rate ($/night)', type: 'number', step: '0.01', required: true },
      { name: 'total_nights', label: 'Total Nights', type: 'number', required: true },
      { name: 'special_requests', label: 'Special Requests', type: 'textarea' },
      { name: 'reservation_status', label: 'Status', type: 'select', options: ['Confirmed', 'Pending', 'Cancelled', 'Completed'], required: true },
    ],
    columns: [
      { key: 'reservation_id', label: 'ID', mono: true },
      { key: 'first_name', label: 'Guest', combineWith: 'last_name' },
      { key: 'room_number', label: 'Room', mono: true },
      { key: 'check_in', label: 'Check-In', format: 'date' },
      { key: 'check_out', label: 'Check-Out', format: 'date' },
      { key: 'reservation_status', label: 'Status', badge: true },
    ],
    filterField: 'reservation_status',
  },

  checkins: {
    endpoint: 'checkins', idKey: 'checkin_id', label: 'Check-Ins', icon: '➡️',
    group: 'guests', order: 7,
    fields: [
      { name: 'reservation_id', label: 'Reservation', type: 'select', ref: 'reservation', refLabel: r => `#${r.reservation_id} · ${r.first_name} ${r.last_name} · Room ${r.room_number}`, required: true },
      { name: 'checkin_time', label: 'Check-In Time', type: 'datetime-local', required: true },
      { name: 'expected_checkout', label: 'Expected Checkout', type: 'datetime-local', required: true },
    ],
    columns: [
      { key: 'checkin_id', label: 'ID', mono: true },
      { key: 'first_name', label: 'Guest', combineWith: 'last_name' },
      { key: 'room_number', label: 'Room', mono: true },
      { key: 'checkin_time', label: 'Check-In Time', format: 'datetime' },
      { key: 'expected_checkout', label: 'Expected Checkout', format: 'datetime' },
    ],
  },

  checkouts: {
    endpoint: 'checkouts', idKey: 'checkout_id', label: 'Check-Outs', icon: '⬅️',
    group: 'guests', order: 8,
    fields: [
      { name: 'checkin_id', label: 'Check-In Record', type: 'select', ref: 'checkins', refLabel: r => `#${r.checkin_id} · ${r.first_name} ${r.last_name} · Room ${r.room_number}`, required: true },
      { name: 'checkout_time', label: 'Checkout Time', type: 'datetime-local', required: true },
      { name: 'extra_charges', label: 'Extra Charges ($)', type: 'number', step: '0.01' },
      { name: 'remarks', label: 'Remarks', type: 'textarea' },
    ],
    columns: [
      { key: 'checkout_id', label: 'ID', mono: true },
      { key: 'first_name', label: 'Guest', combineWith: 'last_name' },
      { key: 'room_number', label: 'Room', mono: true },
      { key: 'checkout_time', label: 'Checkout Time', format: 'datetime' },
      { key: 'extra_charges', label: 'Extra Charges', format: 'currency', mono: true },
    ],
  },

  services: {
    endpoint: 'services', idKey: 'service_id', label: 'Services', icon: '🛎️',
    group: 'billing', order: 9,
    fields: [
      { name: 'service_name', label: 'Service Name', type: 'text', required: true, placeholder: 'Spa Massage' },
      { name: 'price', label: 'Price ($)', type: 'number', step: '0.01', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    columns: [
      { key: 'service_id', label: 'ID', mono: true },
      { key: 'service_name', label: 'Service' },
      { key: 'price', label: 'Price', format: 'currency', mono: true },
      { key: 'description', label: 'Description' },
    ],
  },

  guestservices: {
    endpoint: 'guestservices', idKey: 'guest_service_id', label: 'Guest Services', icon: '🧾',
    group: 'billing', order: 10,
    fields: [
      { name: 'reservation_id', label: 'Reservation', type: 'select', ref: 'reservation', refLabel: r => `#${r.reservation_id} · ${r.first_name} ${r.last_name}`, required: true },
      { name: 'service_id', label: 'Service', type: 'select', ref: 'services', refLabel: r => `${r.service_name} ($${r.price})`, required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'total_price', label: 'Total Price ($)', type: 'number', step: '0.01', required: true },
      { name: 'service_date', label: 'Service Date', type: 'date', required: true },
    ],
    columns: [
      { key: 'guest_service_id', label: 'ID', mono: true },
      { key: 'service_name', label: 'Service' },
      { key: 'first_name', label: 'Guest', combineWith: 'last_name' },
      { key: 'room_number', label: 'Room', mono: true },
      { key: 'quantity', label: 'Qty' },
      { key: 'total_price', label: 'Total', format: 'currency', mono: true },
    ],
  },

  bills: {
    endpoint: 'bills', idKey: 'bill_id', label: 'Bills', icon: '💳',
    group: 'billing', order: 11,
    fields: [
      { name: 'reservation_id', label: 'Reservation', type: 'select', ref: 'reservation', refLabel: r => `#${r.reservation_id} · ${r.first_name} ${r.last_name}`, required: true },
      { name: 'room_charges', label: 'Room Charges ($)', type: 'number', step: '0.01', required: true },
      { name: 'service_charges', label: 'Service Charges ($)', type: 'number', step: '0.01' },
      { name: 'discount', label: 'Discount ($)', type: 'number', step: '0.01' },
      { name: 'tax', label: 'Tax ($)', type: 'number', step: '0.01' },
      { name: 'total_amount', label: 'Total Amount ($)', type: 'number', step: '0.01', required: true },
      { name: 'bill_date', label: 'Bill Date', type: 'date', required: true },
    ],
    columns: [
      { key: 'bill_id', label: 'ID', mono: true },
      { key: 'first_name', label: 'Guest', combineWith: 'last_name' },
      { key: 'room_number', label: 'Room', mono: true },
      { key: 'total_amount', label: 'Total', format: 'currency', mono: true },
      { key: 'bill_date', label: 'Date', format: 'date' },
    ],
  },

  payments: {
    endpoint: 'payments', idKey: 'payment_id', label: 'Payments', icon: '💰',
    group: 'billing', order: 12,
    fields: [
      { name: 'bill_id', label: 'Bill', type: 'select', ref: 'bills', refLabel: r => `#${r.bill_id} · ${r.first_name} ${r.last_name} · $${r.total_amount}`, required: true },
      { name: 'amount_paid', label: 'Amount Paid ($)', type: 'number', step: '0.01', required: true },
      { name: 'payment_method', label: 'Payment Method', type: 'select', options: ['Cash', 'Card', 'Online', 'UPI', 'Bank Transfer'], required: true },
      { name: 'payment_status', label: 'Payment Status', type: 'select', options: ['Paid', 'Pending', 'Failed', 'Refunded'], required: true },
      { name: 'payment_date', label: 'Payment Date', type: 'date', required: true },
      { name: 'transaction_reference', label: 'Transaction Reference', type: 'text' },
    ],
    columns: [
      { key: 'payment_id', label: 'ID', mono: true },
      { key: 'first_name', label: 'Guest', combineWith: 'last_name' },
      { key: 'amount_paid', label: 'Amount', format: 'currency', mono: true },
      { key: 'payment_method', label: 'Method' },
      { key: 'payment_status', label: 'Status', badge: true },
      { key: 'payment_date', label: 'Date', format: 'date' },
    ],
    filterField: 'payment_status',
  },

  departments: {
    endpoint: 'departments', idKey: 'department_id', label: 'Departments', icon: '🏛️',
    group: 'staff', order: 13,
    fields: [
      { name: 'department_name', label: 'Department Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    columns: [
      { key: 'department_id', label: 'ID', mono: true },
      { key: 'department_name', label: 'Department' },
      { key: 'description', label: 'Description' },
    ],
  },

  employees: {
    endpoint: 'employees', idKey: 'employee_id', label: 'Employees', icon: '👔',
    group: 'staff', order: 14,
    fields: [
      { name: 'department_id', label: 'Department', type: 'select', ref: 'departments', refLabel: r => r.department_name, required: true },
      { name: 'branch_id', label: 'Branch', type: 'select', ref: 'branches', refLabel: r => r.branch_name, required: true },
      { name: 'first_name', label: 'First Name', type: 'text', required: true },
      { name: 'last_name', label: 'Last Name', type: 'text', required: true },
      { name: 'designation', label: 'Designation', type: 'text', required: true, placeholder: 'Front Desk Manager' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'salary', label: 'Salary ($)', type: 'number', step: '0.01', required: true },
      { name: 'hire_date', label: 'Hire Date', type: 'date', required: true },
      { name: 'shift', label: 'Shift', type: 'select', options: ['Morning', 'Evening', 'Night'] },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
    ],
    columns: [
      { key: 'employee_id', label: 'ID', mono: true },
      { key: 'first_name', label: 'Name', combineWith: 'last_name' },
      { key: 'designation', label: 'Designation' },
      { key: 'department_name', label: 'Department' },
      { key: 'branch_name', label: 'Branch' },
      { key: 'status', label: 'Status', badge: true },
    ],
    filterField: 'status',
  },

  housekeeping: {
    endpoint: 'housekeeping', idKey: 'housekeeping_id', label: 'Housekeeping', icon: '🧹',
    group: 'staff', order: 15,
    fields: [
      { name: 'room_id', label: 'Room', type: 'select', ref: 'rooms', refLabel: r => `Room ${r.room_number}`, required: true },
      { name: 'employee_id', label: 'Assigned Staff', type: 'select', ref: 'employees', refLabel: r => `${r.first_name} ${r.last_name}`, required: true },
      { name: 'cleaning_date', label: 'Cleaning Date', type: 'date', required: true },
      { name: 'cleaning_status', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Completed'], required: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea' },
    ],
    columns: [
      { key: 'room_number', label: 'Room', mono: true },
      { key: 'employee_first_name', label: 'Staff', combineWith: 'employee_last_name' },
      { key: 'cleaning_date', label: 'Date', format: 'date' },
      { key: 'cleaning_status', label: 'Status', badge: true },
    ],
    filterField: 'cleaning_status',
  },

  maintenance: {
    endpoint: 'maintenance', idKey: 'maintenance_id', label: 'Maintenance', icon: '🔧',
    group: 'staff', order: 16,
    fields: [
      { name: 'room_id', label: 'Room', type: 'select', ref: 'rooms', refLabel: r => `Room ${r.room_number}`, required: true },
      { name: 'employee_id', label: 'Assigned Staff (optional)', type: 'select', ref: 'employees', refLabel: r => `${r.first_name} ${r.last_name}`, required: false },
      { name: 'issue_description', label: 'Issue Description', type: 'textarea', required: true },
      { name: 'reported_date', label: 'Reported Date', type: 'date', required: true },
      { name: 'resolved_date', label: 'Resolved Date', type: 'date' },
      { name: 'maintenance_status', label: 'Status', type: 'select', options: ['Reported', 'In Progress', 'Resolved'], required: true },
    ],
    columns: [
      { key: 'maintenance_id', label: 'ID', mono: true },
      { key: 'room_number', label: 'Room', mono: true },
      { key: 'issue_description', label: 'Issue' },
      { key: 'maintenance_status', label: 'Status', badge: true },
      { key: 'reported_date', label: 'Reported', format: 'date' },
    ],
    filterField: 'maintenance_status',
  },
};

/* Nav grouping metadata (order + label for horizontal dropdown menus) */
const NAV_GROUPS = [
  { key: 'setup', label: 'Property Setup', icon: '🏨' },
  { key: 'guests', label: 'Guests & Bookings', icon: '📖' },
  { key: 'billing', label: 'Services & Billing', icon: '💳' },
  { key: 'staff', label: 'Staff & Operations', icon: '👥' },
];
