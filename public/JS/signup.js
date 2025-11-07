document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  
  const signupName = document.getElementById('signupName').value.trim();
  const signupEmail = document.getElementById('signupEmail').value.trim();
  const signupPhone = document.getElementById('signupPhone').value.trim();
  const signupPassword = document.getElementById('signupPassword').value;

  
  const userData = {
    name: signupName,
    email: signupEmail,
    phone: signupPhone,
    password: signupPassword
  };

  // optional client-side validation
  if (!userData.name || !userData.email || !userData.phone || !userData.password) {
    return console.error('All fields are required');
  }

  try {
    const res = await axios.post('/signup', userData);

    if (res.status === 201) {
      console.log('Signup successful!');
      e.target.reset();
      setTimeout(() => (location.href = 'login.html'), 1500);
    } else {
      console.error('Signup failed');
    }
  } catch (err) {
    console.error(err.response?.data?.error || 'Signup failed');
  }
});
