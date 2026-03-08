const API_BASE = "https://superstaragencies.in/backend";

const loginForm = document.getElementById("loginForm");

console.log('Login form element:', loginForm);

if (loginForm) {
  console.log('Attaching submit event listener to login form');
  loginForm.addEventListener("submit", e => {
    console.log('Form submit event triggered');
    e.preventDefault();
    login();
  });
} else {
  console.error('ERROR: Login form not found! Element with id="loginForm" does not exist.');
}

function showModal(title, message) {
  const modal = document.getElementById("modal");
  if (!modal) {
    alert(title + ": " + message);
    return;
  }
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalMsg").innerText = message;
  modal.classList.remove("hidden");
  // Focus the primary action inside the modal for keyboard users
  const btn = modal.querySelector('.modal-actions button');
  if (btn) btn.focus();
}

function closeModal() {
  document.getElementById("modal")?.classList.add("hidden");
}

async function login() {
  console.log('=== LOGIN FUNCTION CALLED ===');

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (!username || !password) {
    showModal("Login Error", "All fields are required");
    return;
  }

  const apiUrl = API_BASE + "/api/admin/login";
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    // If server returned an error status, try to read JSON message where possible
    if (!res.ok) {
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) {
        try {
          const errData = await res.json();
          showModal("Login Failed", errData.message || "Invalid credentials. Please try again.");
        } catch (e) {
          showModal("Login Failed", "Invalid credentials. Please try again.");
        }
      } else {
        // Non-JSON error (HTML page), show friendly message
        showModal("Login Failed", "Server returned an unexpected response. Please try again later.");
      }
      return;
    }

    // Ensure response is JSON before parsing
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      showModal("Server Error", "Unexpected server response. Please try again later.");
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      showModal("Server Error", "Unable to parse server response. Please try again.");
      return;
    }

    if (data && data.token) {
      localStorage.setItem("admin_token", data.token);
      window.location.href = "products.html";
    } else {
      showModal("Login Failed", (data && data.message) || "Invalid credentials. Please try again.");
    }
  } catch (err) {
    console.error('Network error during login:', err);
    // As requested, show exact message for network error
    showModal("Network Error", "Server unreachable");
  }
}

function logout() {
  localStorage.removeItem("admin_token");
  window.location.href = "login.html";
}
