class RegisterView {
  getTemplate() {
    return `
          <section class="container">
            <h1>Daftar</h1>
            <form id="register-form">
              <label for="name">Nama:</label>
              <input type="text" id="name" required />
    
              <label for="email">Email:</label>
              <input type="email" id="email" required />
    
              <label for="password">Password:</label>
              <input type="password" id="password" required minlength="8" />
    
              <button type="submit">Daftar</button>
            </form>
          </section>
        `;
  }

  setupFormSubmitHandler(handler) {
    const form = document.querySelector("#register-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      handler({ name, email, password });
    });
  }

  showSuccessMessage(message) {
    alert(message || "Registrasi berhasil! Silakan login.");
  }

  showErrorMessage(message) {
    alert(message || "Gagal daftar");
  }
}

export default RegisterView;
