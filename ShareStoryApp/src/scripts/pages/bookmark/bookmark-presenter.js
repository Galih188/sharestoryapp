import BookmarkModel from "./bookmark-model";
import BookmarkView from "./bookmark-view";

class BookmarkPresenter {
  constructor() {
    this.view = new BookmarkView();
  }

  async init() {
    document.querySelector("main").innerHTML = this.view.getTemplate();

    try {
      const bookmarkedStories = BookmarkModel.getBookmarks();
      this.view.showStories(bookmarkedStories, {
        onRemoveBookmark: (id) => this.removeBookmark(id),
      });
    } catch (err) {
      this.view.showError("Gagal memuat daftar bookmark.");
    }
  }

  removeBookmark(id) {
    BookmarkModel.removeBookmark(id);
    const updated = BookmarkModel.getBookmarks();
    this.view.showStories(updated, {
      onRemoveBookmark: (id) => this.removeBookmark(id),
    });
  }
}

export default new BookmarkPresenter();
