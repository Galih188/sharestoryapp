import StoryModel from "../../data/story-model.js";
import RegisterView from "./register-view.js";
import RegisterPresenter from "./register-presenter.js";

export default class RegisterPage {
  #presenter;
  #view;

  constructor() {
    this.#view = new RegisterView();
    const model = new StoryModel();
    this.#presenter = new RegisterPresenter({ model, view: this.#view });
  }

  async render() {
    return this.#view.getTemplate();
  }

  async afterRender() {
    await this.#presenter.init();
  }
}
