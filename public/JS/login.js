document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const identifierInput = document.getElementById('loginIdentifier').value.trim();
  const passwordInput = document.getElementById('loginPassword').value;

  const loginData = {
    identifier: identifierInput,
    password: passwordInput
  };

  if (!identifierInput || !passwordInput) {
    return console.error('Both fields are required');
  }

  try {
    const res = await axios.post('/login', loginData);

    if (res.status === 200 && res.data.token) {
      console.log('✅ Login successful!');
      e.target.reset();
      localStorage.setItem('token', res.data.token);
      setTimeout(() => (location.href = 'chat.html'), 1500);
    } else {
      console.error('Login failed. Invalid credentials.');
    }
  } catch (err) {
    console.error(err.response?.data?.error || 'Login failed');
  }
});
