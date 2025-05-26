import { showFormattedDate } from "../../utils/index";

class HomeView {
  getTemplate() {
    return `
      <section class="container">
        <h1>Daftar Cerita</h1>
        <div id="stories-list" class="stories-list"></div>
        <h2>Lokasi Cerita</h2>
        <div id="stories-map" style="height: 400px; margin-top: 1rem; border-radius: 8px; border: 1px solid #ccc;"></div>
        <div class="map-info" style="margin-top: 0.5rem; color: #666;">
          <small>Klik marker untuk melihat detail cerita</small>
        </div>
      </section>
    `;
  }

  showLoading() {
    const storiesContainer = document.querySelector("#stories-list");
    storiesContainer.innerHTML = `
      <div class="loader">Loading stories...</div>
    `;
  }

  showStories(stories, handlers) {
    const storiesContainer = document.querySelector("#stories-list");
    if (stories.length === 0) {
      storiesContainer.innerHTML = `
      <div class="empty-state">
        <p>Tidak ada cerita yang ditampilkan.</p>
      </div>
    `;
      return;
    }

    storiesContainer.innerHTML = stories
      .map(
        (story) => `
        <article class="story-item">
          <img src="${story.photoUrl}" alt="Foto oleh ${
          story.name
        }" class="story-img" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Foto+Tidak+Tersedia';" />
          <h2>${story.name}</h2>
          <p>${story.description}</p>
          <time datetime="${story.createdAt}">${showFormattedDate(
          story.createdAt,
          "id-ID"
        )}</time>
          <div class="story-actions">
            <button class="bookmark-btn" data-id="${
              story.id
            }" aria-label="Simpan cerita">🔖 Simpan Cerita</button>
          </div>
        </article>
      `
      )
      .join("");

    const bookmarkButtons = document.querySelectorAll(".bookmark-btn");
    bookmarkButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        if (handlers && typeof handlers.onBookmarkStory === "function") {
          handlers.onBookmarkStory(id);
        }
      });
    });
  }

  showError(message) {
    const storiesContainer = document.querySelector("#stories-list");
    storiesContainer.innerHTML = `
      <div class="error-state">
        <p>${message}</p>
      </div>
    `;
  }

  showMessage(message, type = "info") {
    const notification = document.querySelector("#notification");
    notification.textContent = message;
    notification.className = `notifiaction ${type}`;
    notification.style.display = "block";

    // Auto hida after 3 seconds
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }

  renderMap(stories) {
    try {
      const mapContainer = document.querySelector("#stories-map");
      if (!mapContainer) return;

      // Periksa apakah ada cerita yang memiliki data lokasi
      const storiesWithLocation = stories.filter(
        (story) => story.lat && story.lon
      );

      if (storiesWithLocation.length === 0) {
        mapContainer.innerHTML =
          "<p>Tidak ada cerita dengan lokasi yang tersedia.</p>";
        return;
      }

      // Create map instance
      const map = L.map("stories-map");

      // Set default view to Indonesia
      map.setView([-2.5, 118], 5);

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Buat custom icon untuk marker
      const customIcon = L.icon({
        iconUrl:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48IS0tIUZvbnQgQXdlc29tZSBGcmVlIDYuNS4xIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlL2ZyZWUgQ29weXJpZ2h0IDIwMjQgRm9udGljb25zLCBJbmMuLS0+PHBhdGggZmlsbD0iI2Q5NzcwNiIgZD0iTTIxNS43IDQ5OS4yQzI2Ny4yIDQzNSAzODQgMjc5LjQgMzg0IDE5MkMzODQgODYgMjk4IDAgMTkyIDBTMCA4NiAwIDE5MmMwIDg3LjQgMTE2LjggMjQzIDIxNi4zIDMwNy4yYzUuOCA0LjAgMTMuNiA0LjAgMTkuNCAwek0xOTIgMTI4YTY0IDY0IDAgMSAxIDAgMTI4IDY0IDY0IDAgMSAxIDAtMTI4eiIvPjwvc3ZnPg==",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
      });

      // Add markers for stories with location
      const bounds = L.latLngBounds();
      const markers = [];

      storiesWithLocation.forEach((story) => {
        const lat = parseFloat(story.lat);
        const lon = parseFloat(story.lon);

        if (!isNaN(lat) && !isNaN(lon)) {
          const latlng = L.latLng(lat, lon);
          bounds.extend(latlng);

          // Menggunakan custom icon
          const marker = L.marker(latlng, { icon: customIcon }).addTo(map)
            .bindPopup(`
            <div class="popup-content">
              <h3>${story.name}</h3>
              <img src="${
                story.photoUrl
              }" alt="Foto cerita" style="width: 100%; max-height: 150px; object-fit: cover; margin: 5px 0;">
              <p>${story.description.substring(0, 100)}${
            story.description.length > 100 ? "..." : ""
          }</p>
            </div>
          `);
          markers.push(marker);
        }
      });

      // Fit map to bounds if we have markers
      if (bounds.isValid()) {
        map.fitBounds(bounds);

        // Jika hanya ada satu marker, zoom yang lebih tepat
        if (markers.length === 1) {
          map.setView(bounds.getCenter(), 12);
        }
      }

      // Paksa update ukuran map setelah render
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } catch (error) {
      console.error("Error rendering map:", error);
      document.querySelector("#stories-map").innerHTML =
        "<p>Gagal memuat peta. Silakan muat ulang halaman.</p>";
    }
  }
}

export default HomeView;
