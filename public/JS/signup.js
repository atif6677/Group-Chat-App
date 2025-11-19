document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const signupName = document.getElementById('signupName').value.trim();
  const signupEmail = document.getElementById('signupEmail').value.trim();
  const signupPhone = document.getElementById('signupPhone').value.trim();
  const signupPassword = document.getElementById('signupPassword').value;

  // ---- VALIDATION FUNCTIONS ----
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    return /^[0-9]{10}$/.test(phone);   // exactly 10 digits
  }

  function isStrongPassword(pass) {
    return pass.length >= 6; // you can make it stronger if needed
  }

  // ---- VALIDATION CHECKS ----
  if (!signupName) {
    return alert("Name is required");
  }

  if (!isValidEmail(signupEmail)) {
    return alert("Invalid email format");
  }

  if (!isValidPhone(signupPhone)) {
    return alert("Phone number must be 10 digits");
  }

  if (!isStrongPassword(signupPassword)) {
    return alert("Password must be at least 6 characters");
  }

  // ---- Prepare data ----
  const userData = {
    name: signupName,
    email: signupEmail,
    phone: signupPhone,
    password: signupPassword
  };

  try {
    const res = await axios.post('/api/signup', userData);

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
