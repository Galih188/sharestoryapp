import StoryModel from "../../data/story-model.js";
import LoginView from "./login-view.js";
import LoginPresenter from "./login-presenter.js";

export default class LoginPage {
  #presenter;
  #view;

  constructor() {
    this.#view = new LoginView();
    const model = new StoryModel();
    this.#presenter = new LoginPresenter({ model, view: this.#view });
  }

  async render() {
    return this.#view.getTemplate();
  }

  async afterRender() {
    await this.#presenter.init();
  }
}
