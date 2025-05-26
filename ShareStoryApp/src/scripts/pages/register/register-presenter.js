class RegisterPresenter {
  #model;
  #view;

  constructor({ model, view }) {
    this.#model = model;
    this.#view = view;
  }

  async init() {
    this.#view.setupFormSubmitHandler(async (data) => {
      try {
        const result = await this.#model.register(
          data.name,
          data.email,
          data.password
        );

        this.#view.showSuccessMessage("Registrasi berhasil! Silakan login.");
        window.location.hash = "/login";
      } catch (error) {
        this.#view.showErrorMessage(error.message);
      }
    });
  }
}

export default RegisterPresenter;
