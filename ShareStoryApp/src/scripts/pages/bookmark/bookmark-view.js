import { showFormattedDate } from "../../utils/index";

class BookmarkView {
  getTemplate() {
    return `
      <section class="container">
        <h1>Daftar Cerita yang Disimpan</h1>
        <div id="bookmark-list" class="stories-list"></div>
      </section>
    `;
  }

  showStories(stories, { onRemoveBookmark }) {
    const container = document.querySelector("#bookmark-list");

    if (stories.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Belum ada cerita disimpan.</p></div>`;
      return;
    }

    container.innerHTML = stories
      .map(
        (story) => `
      <article class="story-item">
        <img src="${story.photoUrl}" alt="${story.name}" class="story-img" />
        <h2>${story.name}</h2>
        <p>${story.description}</p>
        <time datetime="${story.createdAt}">${showFormattedDate(
          story.createdAt,
          "id-ID"
        )}</time>
        <div class="story-actions">
          <button class="remove-bookmark-btn" data-id="${story.id}">
            ❌ Hapus Bookmark
          </button>
        </div>
      </article>
    `
      )
      .join("");

    const removeButtons = container.querySelectorAll(".remove-bookmark-btn");
    removeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        onRemoveBookmark(id);
      });
    });
  }

  showError(message) {
    document.querySelector("#bookmark-list").innerHTML = `<p>${message}</p>`;
  }
}

export default BookmarkView;
