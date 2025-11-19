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
    const res = await axios.post('/api/login', loginData);

    if (res.status === 200 && res.data.token) {
      console.log('✅ Login successful!');
      e.target.reset();

      // ✅ Save token, userId, and user name
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('userName', res.data.name);
      localStorage.setItem("email", res.data.userEmail);


      setTimeout(() => (location.href = 'chat.html'), 1500);
    } else {
      console.error('Login failed. Invalid credentials.');
    }
  } catch (err) {
    console.error(err.response?.data?.error || 'Login failed');
  }
});
