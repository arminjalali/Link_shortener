// Perform user registration when the registration form is submitted
function registerUser() {
  var username = document.getElementById('reg-username').value;
  var email = document.getElementById('reg-email').value;
  var password = document.getElementById('reg-password').value;
  var confirmPassword = document.getElementById('reg-confirm-password').value;

  // Validate username
  var usernamePattern = /^[A-Za-z0-9_]{3,}$/;
  if (!usernamePattern.test(username)) {
    alert('Error: Invalid username format. Username must be at least 3 characters long and can only contain letters, numbers, and underscores.');
    return;
  }

  // Validate email format using regular expression
  var emailPattern = /^[A-Za-z][A-Za-z0-9._]+@[A-Za-z0-9]+\.[A-Za-z]{2,}$/;
  if (!emailPattern.test(email)) {
    alert('Error: Invalid email format.');
    return;
  }

  // Validate password
  if (password !== confirmPassword) {
    alert('Error: Passwords do not match.');
    return;
  }

  if (password.length < 8) {
    alert('Error: Password should be at least 8 characters long.');
    return;
  }

  // Create a request body object
  var requestBody = {
    username: username,
    email: email,
    password: password,
  };

  // Send a POST request to the backend registration endpoint
  fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
    .then(response => response.json())
    .then(data => {
      // Handle the response from the backend
      if (data.error) {
        alert('Registration failed: ' + data.error);
      } else {
        alert('Registration successful.');
      }
    })
    .catch(error => {
      console.error('Error occurred during registration:', error);
    });
}

// Perform user login when the login form is submitted
function loginUser() {
  var username = document.getElementById('login-username').value;
  var password = document.getElementById('login-password').value;

  // Create a request body object
  var requestBody = {
    username: username,
    password: password
  };

  // Send a POST request to the backend login endpoint
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
    .then(response => response.json())
    .then(data => {
      // Handle the response from the backend
      if (data.error) {
        alert('Login failed: ' + data.error);
      } else {
        // Save the received token in the browser's localStorage
        localStorage.setItem('token', data.token);
        window.location.href = '/user.html';
      }
    })
    .catch(error => {
      console.error('Error occurred during login:', error);
    });
}

// Shorten a URL
function shortenUrl() {
  var url = document.getElementById('url').value;

  // Create a request body object
  var requestBody = {
    url: url
  };

  // Send a POST request to the backend URL shortening endpoint
  fetch('/api/shorten', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token') // Include the JWT token in the request headers
    },
    body: JSON.stringify(requestBody)
  })
    .then(response => response.json())
    .then(data => {
      // Handle the response from the backend
      if (data.error) {
        alert('URL shortening failed: ' + data.error);
      } else {
        // Display the shortened link
        document.getElementById('shorten-message').innerHTML = 'Shortened Link: ' + data.shortenedLink;
        // Display the QR code for the original link
        displayQRCode(data.originalLink);
      }
    })
    .catch(error => {
      console.error('Error occurred during URL shortening:', error);
    });
}
function redirect() {
  var hashedLink = document.getElementById('hashed-link').value;

  // Send a GET request to the backend to retrieve the original link
  fetch('/api/redirect/' + hashedLink)
    .then(response => response.json())
    .then(data => {
      // Handle the response from the backend
      if (data.error) {
        alert('Error: ' + data.error);
      } else {
        // Redirect to the original link
        window.location.href = data.originalLink;
      }
    })
    .catch(error => {
      console.error('Error occurred during redirection:', error);
    });
}

// Function to handle the "Show" button click event
function showUserInfo() {
  var username = document.getElementById('username').value;

  // Create a request body object
  var requestBody = {
    username: username
  };

  // Send a POST request to the server-side endpoint to retrieve user information
  fetch('/api/user-info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
    .then(response => response.json())
    .then(data => {
      // Handle the response from the server
      if (data.error) {
        alert('Error: ' + data.error);
      } else {
        // Display the user information and associated links
        var userInfo = 'User Information:\n\n' +
          'Username: ' + data.username + '\n' +
          'Email: ' + data.email + '\n' +
          'Password: ' + data.password + '\n' +
          'Created At: ' + data.created_at + '\n' +
          'Updated At: ' + data.updated_at + '\n\n';

        var linksInfo = 'Links:\n\n';
        data.links.forEach(function (link) {
          linksInfo += 'URL: ' + link.url + '\n' +
            'Short Hash: ' + link.short_hash + '\n' +
            'Views: ' + link.views + '\n' +
            'Created At: ' + link.created_at + '\n\n';
        });

        var userInfoText = document.getElementById('user-info-text');
        userInfoText.textContent = userInfo + linksInfo;
      }
    })
    .catch(error => {
      console.error('Error occurred while retrieving user information:', error);
    });
}



// Generate and display the QR code
function displayQRCode(link) {
  const qrCodeContainer = document.getElementById('qrcode-container');
  qrCodeContainer.innerHTML = ''; // Clear any previous QR code

  // Generate the QR code using the link
  qrcode.toCanvas(link, { errorCorrectionLevel: 'H', margin: 1 }, function (error, canvas) {
    if (error) {
      console.error('Error occurred while generating QR code:', error);
    } else {
      // Append the QR code canvas to the container
      qrCodeContainer.appendChild(canvas);
    }
  });
}


