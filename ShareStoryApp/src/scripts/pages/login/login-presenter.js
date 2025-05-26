class LoginPresenter {
  #model;
  #view;

  constructor({ model, view }) {
    this.#model = model;
    this.#view = view;
  }

  async init() {
    this.#view.setupFormSubmitHandler(async (data) => {
      try {
        const result = await this.#model.login(data.email, data.password);

        localStorage.setItem("token", result.loginResult.token);
        this.#view.showSuccessMessage("Login berhasil!");
        window.location.hash = "/";
      } catch (error) {
        this.#view.showErrorMessage(error.message);
      }
    });
  }
}

export default LoginPresenter;
