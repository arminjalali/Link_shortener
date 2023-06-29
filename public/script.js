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

  // Send URL to the backend to get the shortened link (not implemented in this example)
  // Assume there's a backend API endpoint for creating a shortened link
  // Example: POST /api/shorten
  // You can use AJAX, fetch, or any other method to send the request
  // Handle the response from the backend accordingly (e.g., display the shortened link)
}

// Fetch user activity when the user.html page is loaded
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');

  // Send a GET request to the backend API endpoint for fetching user activity
  fetch('/api/user/activity', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error occurred while fetching user activity: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      // Handle the response from the backend
      // Display user activity on the page
      var activityTable = document.getElementById('activityTable');
      data.forEach(activity => {
        var row = activityTable.insertRow();
        var cell = row.insertCell();
        cell.appendChild(document.createTextNode(activity.activity_name));
      });
    })
    .catch(error => {
      console.error('Error occurred while fetching user activity:', error);
      // Handle the error and display an appropriate message to the user
      alert('Error occurred while fetching user activity: ' + error.message);
    });
});
