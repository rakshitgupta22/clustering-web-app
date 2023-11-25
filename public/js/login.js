"use strict";

// Get all the elements from the login form
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");

// Add event listener to the login form
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = usernameInput.value;
  const password = passwordInput.value;

  try {
    // Send a POST request to the server
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      console.log("Login successful");
      loginError.innerHTML = "";
      window.location.href = "/dashboard";
    } else {
      const { message } = await response.json();
      throw new Error(message);
    }
  } catch (error) {
    console.error("Error:", error);
    loginError.innerHTML = error.message;
  }
});
