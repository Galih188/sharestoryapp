import AboutView from "./about-view.js";
import AboutPresenter from "./about-presenter.js";

export default class AboutPage {
  #view;
  #presenter;

  constructor() {
    this.#view = new AboutView();
    this.#presenter = new AboutPresenter({ view: this.#view });
  }

  async render() {
    return this.#view.getTemplate();
  }

  async afterRender() {}
}
