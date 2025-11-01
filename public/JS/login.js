document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();

  const id = document.getElementById('login-identifier'),
        pw = document.getElementById('login-password'),
        identifier = id.value.trim(),
        password = pw.value,
        valid = /^\S+@\S+\.\S+$/.test(identifier) || /^\d{10,}$/.test(identifier);

  if (!valid || !password) return console.error('Enter valid email/phone and password');

  try {
    const res = await axios.post('/login', { identifier, password });
    if (res.status === 200 && res.data.token) {
      console.log('Login successful!');
      e.target.reset();
      localStorage.setItem('token', res.data.token);
      setTimeout(() => (location.href = 'dashboard.html'), 1500);
    } else console.error('Login failed');
  } catch (err) {
    console.error(err.response?.data?.error || 'Login failed');
  }
});
