const token = localStorage.getItem("admin_token");

if (!token) {
  window.location.replace("login.html");
}