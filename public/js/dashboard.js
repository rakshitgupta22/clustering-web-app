window.addEventListener("DOMContentLoaded", async () => {
  const token = window.localStorage.getItem("token");
  if (token) {

    const sessionResponse = await fetch(`/session/${token}`);
    if (sessionResponse.ok) {
        const { username } = await sessionResponse.json();
        // document.getElementById("username").innerHTML = username;
    } else {
        console.log("Session expired");
        window.location.href = "/";
        window.localStorage.removeItem("token");
    }
    }
})