class LoginView {
  getTemplate() {
    return `
          <section class="container">
            <h1>Masuk</h1>
            <form id="login-form">
              <label for="email">Email:</label>
              <input type="email" id="email" required />
    
              <label for="password">Password:</label>
              <input type="password" id="password" required />
    
              <button type="submit">Masuk</button>
            </form>
          </section>
        `;
  }

  setupFormSubmitHandler(handler) {
    const form = document.querySelector("#login-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      handler({ email, password });
    });
  }

  showSuccessMessage(message) {
    alert(message || "Login berhasil!");
  }

  showErrorMessage(message) {
    alert(message || "Terjadi kesalahan saat login");
  }
}

export default LoginView;
