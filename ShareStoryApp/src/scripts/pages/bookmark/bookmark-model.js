class BookmarkModel {
  static getBookmarks() {
    return JSON.parse(localStorage.getItem("savedStories") || "[]");
  }

  static saveBookmark(story) {
    const saved = this.getBookmarks();

    if (!saved.find((s) => s.id === story.id)) {
      saved.push(story);
      localStorage.setItem("savedStories", JSON.stringify(saved));
    }
  }

  static removeBookmark(id) {
    const saved = this.getBookmarks().filter((s) => s.id !== id);
    localStorage.setItem("savedStories", JSON.stringify(saved));
  }

  static isBookmarked(id) {
    return this.getBookmarks().some((s) => s.id === id);
  }
}

export default BookmarkModel;
