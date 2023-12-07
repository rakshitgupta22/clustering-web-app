"use strict";

// Get all the elements from the login form
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");

window.addEventListener("DOMContentLoaded", async () => {
  const token = window.localStorage.getItem("token");
  if (token) {
    const sessionResponse = await fetch(`/session/${token}`);
    if (sessionResponse.ok) {
      const { username } = await sessionResponse.json();
      // document.getElementById("username").innerHTML = username;
      window.location.href = "/dashboard";
    } else {
      console.log("Session expired");
      window.location.href = "/";
      window.localStorage.removeItem("token");
      // delete token from the server
      const response = await fetch("/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const { message } = await response.json();

      if (response.ok) {
        console.log(message);
      } else {
        console.error("Error:", message);
      }
    }
  }
});

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
      const token = response.headers.get("Authorization");
      window.localStorage.setItem("token", token);
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
