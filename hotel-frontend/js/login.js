function login() {
  const username = document.getElementById('username').value;

  const password = document.getElementById('password').value;

  const role = document.getElementById('role').value;

  if (role === 'admin') {
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('role', 'admin');

      window.location = 'admin.html';

      return;
    }
  }

  if (role === 'user') {
    if (username === 'user' && password === 'user123') {
      localStorage.setItem('role', 'user');

      window.location = 'user.html';

      return;
    }
  }

  document.getElementById('error').innerHTML = 'Invalid Login';
}
