// Function to display a status message on the login page
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

// --- Login Form Handler ---
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Stop the default form submission

    // Clear previous messages
    displayMessage('', '');

    // Collect data
    const identifier = document.getElementById('login-identifier').value.trim(); // Email or Phone
    const password = document.getElementById('login-password').value;

    // Basic check for identifier format (Email or Phone)
    const isEmail = /^\S+@\S+\.\S+$/.test(identifier);
    const isPhone = /^\d{10,}$/.test(identifier);

    if (!isEmail && !isPhone) {
        displayMessage('error', 'Please enter a valid email or phone number.');
        return;
    }
    
    if (!password) {
        displayMessage('error', 'Please enter your password.');
        return;
    }

    // Prepare data object
    const loginData = {
        identifier: identifier,
        password: password
    };

    console.log('--- Login Data Collected ---');
    console.log(loginData);

    // *SIMULATION* of a login attempt
    // In a real app, you'd send this to a server.
    // For this demo, we'll just simulate a success.
    
    displayMessage('success', 'Login successful! Welcome back.');
    
    // Clear the form
    this.reset();
});