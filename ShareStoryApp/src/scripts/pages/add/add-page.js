import StoryModel from "../../data/story-model.js";
import AddStoryView from "./add-view.js";
import AddStoryPresenter from "./add-presenter.js";

export default class AddStoryPage {
  #presenter;
  #view;

  constructor() {
    this.#view = new AddStoryView();
    const model = new StoryModel();
    this.#presenter = new AddStoryPresenter({ model, view: this.#view });
  }

  async render() {
    return this.#view.getTemplate();
  }

  async afterRender() {
    // Initialize presenter after the view template has been rendered
    await this.#presenter.init();

    // Setup cleanup when user navigates away from page
    window.addEventListener("hashchange", () => {
      this.#presenter.cleanup();
    });

    // Additional cleanup on page unload
    window.addEventListener("beforeunload", () => {
      this.#presenter.cleanup();
    });
  }

  // /**
  //  * Adds event listener for notification feature
  //  * Note: This method seems to reference an element that doesn't appear in the view template
  //  * Consider moving this to the view init method with a callback to presenter if this element exists
  //  */
  // addNotifyMeEventListener() {
  //   const notifyMeBtn = document.getElementById("story-detail-notify-me");
  //   if (notifyMeBtn) {
  //     notifyMeBtn.addEventListener("click", () => {
  //       this.#presenter.notifyMe();
  //     });
  //   }
  // }
}
