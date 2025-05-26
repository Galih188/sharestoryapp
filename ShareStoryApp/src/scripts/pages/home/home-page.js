import StoryModel from "../../data/story-model.js";
import HomeView from "./home-view.js";
import HomePresenter from "./home-presenter.js";

export default class HomePage {
  #presenter;
  #view;

  constructor() {
    this.#view = new HomeView();
    const model = new StoryModel();
    this.#presenter = new HomePresenter({ model, view: this.#view });
  }

  async render() {
    return this.#view.getTemplate();
  }

  async afterRender() {
    await this.#presenter.fetchStories();
  }
}
