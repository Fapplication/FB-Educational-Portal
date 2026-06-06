// ============================================================
//  js/auth.js  –  Authentication Logic
// ============================================================

// ── STUDENT LOGIN ───────────────────────────────────────────
async function studentLogin() {
  const id  = document.getElementById("login-id").value.trim();
  const pwd = document.getElementById("login-password").value;
  const err = document.getElementById("login-error");
  const btn = document.getElementById("login-btn-text");

  err.classList.add("hidden");
  if (!id || !pwd) { showError(err, "Please enter your Student ID and password."); return; }

  btn.textContent = "Signing in…";

  try {
    let user = null;

    if (Sheets._useMock()) {
      // ── Mock mode ──
      user = Sheets.mockGetUser(id);
    } else {
      user = await Sheets.getUser(id);
    }

    if (!user) {
      showError(err, "Student ID not found. Please register first."); return;
    }
    if (user.password !== pwd) {
      showError(err, "Incorrect password. Please try again."); return;
    }

    Session.student.set(user);
    showToast("Welcome back, " + user.name + "!");
    initStudentDashboard(user);
    showPage("student-dashboard");

  } catch (e) {
    showError(err, "Connection error. Please try again.");
    console.error(e);
  } finally {
    btn.textContent = "Sign In";
  }
}

// ── STUDENT REGISTER ────────────────────────────────────────
async function studentRegister() {
  const id       = document.getElementById("reg-id").value.trim();
  const name     = document.getElementById("reg-name").value.trim();
  const telegram = document.getElementById("reg-telegram").value.trim();
  const pwd      = document.getElementById("reg-password").value;
  const confirm  = document.getElementById("reg-confirm").value;
  const err      = document.getElementById("reg-error");
  const suc      = document.getElementById("reg-success");
  const btn      = document.getElementById("reg-btn-text");

  err.classList.add("hidden");
  suc.classList.add("hidden");

  if (!id || !name || !pwd || !confirm) { showError(err, "All fields are required."); return; }
  if (pwd !== confirm)                  { showError(err, "Passwords do not match."); return; }
  if (pwd.length < 6)                   { showError(err, "Password must be at least 6 characters."); return; }

  btn.textContent = "Registering…";

  try {
    // Check authorization
    let authorized = false;
    let authorizedName = null;

    if (Sheets._useMock()) {
      authorized     = Sheets.mockIsAuthorized(id);
      authorizedName = Sheets.mockGetAuthorizedName(id);
    } else {
      authorized     = await Sheets.isAuthorizedID(id);
      authorizedName = await Sheets.getAuthorizedName(id);
    }

    if (!authorized) {
      showError(err, "Your ID is not in the authorized list. Contact your instructor.");
      return;
    }

    // Check if already registered
    let existing = null;
    if (Sheets._useMock()) {
      existing = Sheets.mockGetUser(id);
    } else {
      existing = await Sheets.getUser(id);
    }

    if (existing) {
      showError(err, "This ID is already registered. Please login instead.");
      return;
    }

    const userData = {
      id,
      password: pwd,
      name:     name || authorizedName,
      telegramUsername: telegram,
    };

    if (Sheets._useMock()) {
      // Mock: save to in-memory list
      Sheets.MOCK.users.push(userData);
      showSuccess(suc, "Registration successful! You can now login.");
    } else {
      const result = await Sheets.registerUser(userData);
      if (result.success) {
        showSuccess(suc, "Registration successful! You can now login.");
      } else {
        showError(err, result.message || "Registration failed.");
      }
    }

  } catch (e) {
    showError(err, "Connection error. Please try again.");
    console.error(e);
  } finally {
    btn.textContent = "Register";
  }
}

// ── INSTRUCTOR LOGIN ─────────────────────────────────────────
async function instructorLogin() {
  const user  = document.getElementById("inst-username").value.trim();
  const pwd   = document.getElementById("inst-password").value;
  const err   = document.getElementById("inst-error");

  err.classList.add("hidden");
  if (!user || !pwd) { showError(err, "Please enter username and password."); return; }

  // Check against config (or eventually a Users sheet with admin flag)
  if (user === CONFIG.ADMIN_USER && pwd === CONFIG.ADMIN_PASS) {
    Session.instructor.set({ name: CONFIG.ADMIN_NAME, username: user });
    showToast("Welcome, " + CONFIG.ADMIN_NAME + "!");
    initInstructorDashboard();
    showPage("instructor-dashboard");
  } else {
    showError(err, "Invalid credentials. Please try again.");
  }
}

// ── LOGOUT ──────────────────────────────────────────────────
function logout() {
  Session.clear();
  showPage("landing-page");
  showToast("You have been logged out.");
}

// ── AUTH HELPERS ─────────────────────────────────────────────
function switchAuthTab(tab, el) {
  document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("student-" + tab + "-form").classList.add("active");
}

function showError(el, msg)   { el.textContent = msg; el.classList.remove("hidden"); }
function showSuccess(el, msg) { el.textContent = msg; el.classList.remove("hidden"); }
