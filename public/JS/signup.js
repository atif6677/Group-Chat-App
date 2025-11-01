document.getElementById('signup-form').addEventListener('submit', async e => {
  e.preventDefault();
  const userData = {
    name: signup-name.value.trim(),
    email: signup-email.value.trim(),
    phoneNumber: signup-phone.value.trim(),
    password: signup-password.value
  };
  try {
    const res = await axios.post('/signup', userData);
    if (res.status === 201) {
      e.target.reset();
      setTimeout(() => (location.href = 'login.html'), 1500);
    } else console.error('Signup failed');
  } catch (err) {
    console.error(err.response?.data?.error || 'Signup failed');
  }
});
