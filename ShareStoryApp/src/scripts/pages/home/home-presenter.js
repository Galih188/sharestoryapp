import BookmarkModel from "../bookmark/bookmark-model";

class HomePresenter {
  #model;
  #view;
  #stories = [];

  constructor({ model, view }) {
    this.#model = model;
    this.#view = view;
  }

  async fetchStories() {
    try {
      this.#view.showLoading();

      const stories = await this.#model.getStories();
      this.#stories = stories;

      this.#view.showStories(stories, {
        onDeleteStory: (id) => this.deleteStory(id),
        onBookmarkStory: (id) => this.bookmarkStory(id), // cukup ID
      });

      const storiesWithLocation = stories.filter((s) => s.lat && s.lon);
      if (storiesWithLocation.length > 0) {
        setTimeout(() => {
          this.#view.renderMap(stories);
        }, 300);
      } else {
        const mapContainer = document.querySelector("#stories-map");
        if (mapContainer) {
          mapContainer.innerHTML = `
            <div style="height: 100%; display: flex; align-items: center; justify-content: center; text-align: center;">
              <p>Tidak ada cerita dengan lokasi yang tersedia.</p>
            </div>
          `;
        }
      }
    } catch (error) {
      this.#view.showError("Gagal memuat cerita. " + error.message);
    }
  }

  bookmarkStory(id) {
    const story = this.#stories.find((s) => s.id === id);
    if (!story) {
      this.#view.showMessage("Cerita tidak ditemukan.", "error");
      return;
    }

    if (!BookmarkModel.isBookmarked(story.id)) {
      BookmarkModel.saveBookmark(story);
      this.#view.showMessage("Cerita disimpan!", "success");
    } else {
      this.#view.showMessage("Cerita sudah disimpan.", "info");
    }
  }

  async deleteStory(id) {
    try {
      // Konfirmasi penghapusan
      const confirm = window.confirm(
        "Yakin ingin menghapus cerita ini dari penyimpanan lokal?"
      );
      if (!confirm) return;

      this.#view.showLoading();

      // Hapus IndexedDB
      await this.#model.deleteStoryFromLocal(id);

      // Refresh daftar cerita
      this.fetchStories();

      // Menampilkan notifikasi sukses
      this.#view.showMessage(
        "Cerita berhasil dihapus dari penyimpanan lokal",
        "success"
      );
    } catch (error) {
      this.#view.showError("Gagal menghapus cerita." + error.message);
    }
  }
}

export default HomePresenter;
