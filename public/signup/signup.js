// Function to display a status message on the signup page
function displayMessage(type, content) {
    const messageArea = document.getElementById('message-area');
    messageArea.textContent = content;
    
    // Simple styling for message type without CSS
    if (type === 'success') {
        messageArea.style.color = 'green';
    } else { // 'error'
        messageArea.style.color = 'red';
    }
}

// --- Signup Form Handler ---
document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Stop the default form submission

    // Clear previous messages
    displayMessage('', '');

    // Collect data
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;

    // Frontend Validation (Basic example)
    if (password.length < 6) {
        displayMessage('error', 'Password must be at least 6 characters long.');
        return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        displayMessage('error', 'Please enter a valid email address.');
        return;
    }
    if (!/^\d{10,}$/.test(phone)) {
        displayMessage('error', 'Please enter a valid phone number (at least 10 digits).');
        return;
    }

    // Prepare data object
    const userData = {
        name: name,
        email: email,
        phoneNumber: phone,
        password: password
    };

    console.log('--- Signup Data Collected ---');
    console.log(userData);

    // *SIMULATION* of a successful signup response
    displayMessage('success', `Signup successful! Welcome, ${name}. Redirecting to login...`);
    
    // Clear the form
    this.reset();
    
    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
});