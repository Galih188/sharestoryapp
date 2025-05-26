import bookmarkPresenter from "./bookmark-presenter";

class BookmarkPage {
  async render() {
    return `
      <section class="main-content">
        <div id="bookmark-page-content"></div>
      </section>
    `;
  }

  async afterRender() {
    await bookmarkPresenter.init();
  }
}

export default BookmarkPage;
