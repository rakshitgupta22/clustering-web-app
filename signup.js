// Get all the elements from the signup form
const signupForm = document.getElementById("signupForm");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameError = document.getElementById("usernameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

// functions to validate username, email and password
const validateUsername = (username) => {
  // Regex to check if username is valid
  const regex = /^[a-zA-Z0-9]{5,12}$/;
  return regex.test(username);
};

const validateEmail = (email) => {
  // Regex to check if email is valid
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  // Regex to check if password is valid
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@#$!])[A-Za-z\d!@#$]{8,}$/;
  return regex.test(password);
};

// Add event listener to the signup form
signupForm.addEventListener("submit", async (e) => {
  const username = usernameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;
  let formIsValid = true;

  // Validate username
  if (!validateUsername(username)) {
    usernameError.innerHTML =
      "Username must be alphanumeric and contain 5-12 characters";
    formIsValid = false;
  } else {
    usernameError.innerHTML = "";
  }

  // Validate email
  if (!validateEmail(email)) {
    emailError.innerHTML = "Email is invalid";
    formIsValid = false;
  } else {
    emailError.innerHTML = "";
  }

  // Validate password
  if (!validatePassword(password)) {
    passwordError.innerHTML =
      "Password must be alphanumeric and contain 8 characters with at least one special character";
    formIsValid = false;
  } else {
    passwordError.innerHTML = "";
  }

  // Prevent form submission if form is invalid
  if (!formIsValid) {
    e.preventDefault();
  }

  // If form is valid, submit form and send data to beckend server
  if (formIsValid) {
    try {
      const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        console.log("Signup successful");
        // Optionally, redirect the user to a success page or perform other actions
      } else {
        throw new Error("Network response was not ok");
        // Handle signup failure (show error message, etc.)
      }
    } catch (error) {
      console.error("Error:", error);
      // Handle network errors
    }
  }
});
