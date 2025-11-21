import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

      const SUPABASE_URL = "https://mqsebxyhynaroemoupwy.supabase.co";
      const SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xc2VieHloeW5hcm9lbW91cHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDM0NzgsImV4cCI6MjA3NDQ3OTQ3OH0.ieD61m0CwOt7I2EA8Dstkd5Xd3RgOMQEFs5zpvB9hTU";

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // DOM Elements
      const container = document.querySelector(".container");
      const registerBtn = document.querySelector(".register-btn");
      const loginBtn = document.querySelector(".login-btn");
      const loginForm = document.getElementById("loginForm");
      const registerForm = document.getElementById("registerForm");
      const toastEl = document.getElementById("toast");

      // Toggle UI
      registerBtn.addEventListener("click", () =>
        container.classList.add("active")
      );
      loginBtn.addEventListener("click", () =>
        container.classList.remove("active")
      );

      // Toast
      function showToast(message, type = "info") {
        let icon = "ℹ️";
        if (type === "success") icon = "✅";
        else if (type === "error") icon = "⚠️";
        toastEl.innerHTML = `<span>${icon}</span> ${message}`;
        toastEl.className = `toast ${type} show`;
        setTimeout(() => {
          toastEl.classList.remove("show");
          setTimeout(() => (toastEl.className = "toast"), 400);
        }, 4000);
      }

      function resetTurnstile() {
        const containers = document.querySelectorAll(".cf-turnstile");
        containers.forEach((el) => {
          if (typeof turnstile !== "undefined") turnstile.reset(el);
        });
      }

      // Google OAuth
      async function signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin + "/index.html",
          },
        });

        if (error) {
          showToast("Erreur lors de la connexion avec Google.", "error");
          console.error("Google OAuth error:", error);
        }
      }

      // --- NOUVELLE FONCTION GITHUB AJOUTÉE ---
      async function signInWithGitHub() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: {
            redirectTo: window.location.origin + "/index.html",
          },
        });

        if (error) {
          showToast("Erreur lors de la connexion avec GitHub.", "error");
          console.error("GitHub OAuth error:", error);
        }
      }
      // --- FIN DE L'AJOUT ---

      // Expose to global scope for onclick
      window.signInWithGoogle = signInWithGoogle;
      window.signInWithGitHub = signInWithGitHub; // --- LIGNE AJOUTÉE ---

      // Login handler
      loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();
        const turnstileToken = loginForm.querySelector(
          'input[name="cf-turnstile-response"]'
        )?.value;

        if (!email || !password)
          return showToast("Veuillez remplir tous les champs.", "error");
        if (!turnstileToken)
          return showToast("Veuillez compléter le CAPTCHA.", "error");

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;

          const user = data.user;
          const username =
            user.user_metadata?.full_name || email.split("@")[0];
          localStorage.setItem("jsaliUser", username);
          showToast(`Connexion réussie ! Bienvenue ${username} !`, "success");

          setTimeout(() => {
            window.location.href = "index.html";
          }, 1500);
        } catch (err) {
          resetTurnstile();
          let msg =
            "Échec de la connexion. Veuillez vérifier vos identifiants.";
          if (
            err.message.includes("Invalid login credentials") ||
            err.message.includes("Email not confirmed")
          ) {
            msg = "Identifiants incorrects ou email non confirmé.";
          }
          showToast(msg, "error");
          console.error("Login error:", err.message);
        }
      });

      // Register handler
      registerForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("register-name").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const password = document
          .getElementById("register-password")
          .value.trim();
        const turnstileToken = registerForm.querySelector(
          'input[name="cf-turnstile-response"]'
        )?.value;

        if (!name || !email || !password)
          return showToast("Veuillez remplir tous les champs.", "error");
        if (!turnstileToken)
          return showToast("Veuillez compléter le CAPTCHA.", "error");

        try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: name },
            },
          });

          if (error) throw error;

          showToast(
            "Compte créé avec succès. Un e-mail de vérification a été envoyé.",
            "success"
          );
          registerForm.reset();
          resetTurnstile();
        } catch (err) {
          resetTurnstile();
          let msg = "Échec de l'inscription. Veuillez réessayer.";
          if (err.message.includes("User already registered")) {
            msg = "Cette adresse e-mail est déjà utilisée.";
          } else if (
            err.message.includes("Password should be at least 6 characters")
          ) {
            msg = "Le mot de passe doit contenir au moins 6 caractères.";
          } else if (err.message.includes("AuthApiError")) {
            msg = "Erreur du serveur d'authentification. Veuillez réessayer.";
          }
          showToast(msg, "error");
          console.error("Register error:", err.message);
        }
      });
