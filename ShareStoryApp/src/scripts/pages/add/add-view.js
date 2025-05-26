class AddStoryView {
  #stream;
  #callbacks;
  #photoData;
  #marker;
  #map;

  constructor() {
    this.#stream = null;
    this.#callbacks = {};
    this.#photoData = null;
    this.#marker = null;
    this.#map = null;
  }

  getTemplate() {
    return `
        <section class="container">
          <h1>Tambah Cerita Baru</h1>
          <form id="story-form">
            <label for="description">Deskripsi:</label>
            <textarea id="description" name="description" required></textarea>
  
            <div id="camera-container" style="margin-bottom: 1rem;">
              <label for="photo">Ambil Gambar:</label>
              <div id="camera-fallback" style="display: none;">
                <input type="file" id="file-input" accept="image/*" capture="environment">
                <p class="note">Kamera tidak tersedia. Silakan unggah foto.</p>
              </div>
              <video id="camera" autoplay style="display: none;"></video>
              <canvas id="snapshot" hidden></canvas>
              <button type="button" id="take-photo" style="margin-top: 1rem;">Ambil Foto</button>
              <div id="preview-container" style="margin-top: 10px; display: none;">
                <img id="preview" style="max-width: 100%; max-height: 300px;" />
              </div>
            </div>

            <label for="map">Lokasi Cerita (Opsional):</label>
            <div class="map-info" style="margin-bottom: 1rem; color: #666;">
              <small>Klik pada peta untuk menentukan lokasi cerita</small>
            </div>
            <input type="hidden" id="lat" name="lat" />
            <input type="hidden" id="lon" name="lon" />
            <div id="map" style="height: 300px; margin: 1rem 0;"></div>
  
            <button type="submit">Kirim Cerita</button>
          </form>
        </section>
      `;
  }

  // Menambahkan fungsi untuk memperbarui status jaringan
  updateNetworkStatus(isOffline) {
    const networkStatus = document.getElementById("network-status");
    if (!networkStatus) return;

    networkStatus.style.display = isOffline ? "block" : "none";
  }

  // Menambahkan fungsi untuk menampilkan warning message
  showWarningMessage(message) {
    alert(message);
  }

  init({ onPhotoCapture, onSubmit }) {
    // Store callbacks
    this.#callbacks = {
      onPhotoCapture,
      onSubmit,
    };

    // Set up form submission
    const form = document.getElementById("story-form");
    form.addEventListener("submit", (e) => this.#handleSubmit(e));

    // Set up photo button
    const takePhotoBtn = document.getElementById("take-photo");
    takePhotoBtn.addEventListener("click", () => this.capturePhoto());
  }

  async initCamera() {
    const cameraEl = document.getElementById("camera");
    const cameraFallbackEl = document.getElementById("camera-fallback");
    const fileInput = document.getElementById("file-input");
    const takePhotoBtn = document.getElementById("take-photo");
    const previewContainer = document.getElementById("preview-container");
    const preview = document.getElementById("preview");

    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log("Browser tidak mendukung API mediaDevices.");
      cameraEl.style.display = "none";
      cameraFallbackEl.style.display = "block";

      // Set up file input as fallback
      fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            preview.src = e.target.result;
            previewContainer.style.display = "block";
            takePhotoBtn.textContent = "Ganti Foto";
            this.#photoData = e.target.result;

            // Notify presenter about the photo data
            if (this.#callbacks.onPhotoCapture) {
              this.#callbacks.onPhotoCapture(e.target.result);
            }
          };
          reader.readAsDataURL(file);
        }
      });

      return;
    }

    try {
      cameraEl.style.display = "block";
      this.#stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraEl.srcObject = this.#stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      cameraEl.style.display = "none";
      cameraFallbackEl.style.display = "block";

      // Set up file input as fallback when camera access failed
      fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            preview.src = e.target.result;
            previewContainer.style.display = "block";
            takePhotoBtn.textContent = "Ganti Foto";
            this.#photoData = e.target.result;

            // Notify presenter about the photo data
            if (this.#callbacks.onPhotoCapture) {
              this.#callbacks.onPhotoCapture(e.target.result);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  initMap() {
    try {
      // Instance map
      this.#map = L.map("map").setView([-2.5, 118], 5);

      // Title layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.#map);

      // Setup map click event
      this.#setupMapClickHandler();

      // Force map size update after mount
      setTimeout(() => {
        this.#map.invalidateSize();

        // Check if coordinates are already stored
        this.#restoreMapMarker();
      }, 200);
    } catch (error) {
      console.error("Error initializing map:", error);
      document.getElementById("map").innerHTML =
        "<p>Tidak dapat memuat peta. Silakan coba lagi nanti.</p>";
    }
  }

  #setupMapClickHandler() {
    if (!this.#map) return;

    const latInput = document.getElementById("lat");
    const lonInput = document.getElementById("lon");

    // Create custom icon for marker
    const customIcon = L.icon({
      iconUrl:
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48IS0tIUZvbnQgQXdlc29tZSBGcmVlIDYuNS4xIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlL2ZyZWUgQ29weXJpZ2h0IDIwMjQgRm9udGljb25zLCBJbmMuLS0+PHBhdGggZmlsbD0iI2Q5NzcwNiIgZD0iTTIxNS43IDQ5OS4yQzI2Ny4yIDQzNSAzODQgMjc5LjQgMzg0IDE5MkMzODQgODYgMjk4IDAgMTkyIDBTMCA4NiAwIDE5MmMwIDg3LjQgMTE2LjggMjQzIDIxNi4zIDMwNy4yYzUuOCA0LjAgMTMuNiA0LjAgMTkuNCAwek0xOTIgMTI4YTY0IDY0IDAgMSAxIDAgMTI4IDY0IDY0IDAgMSAxIDAtMTI4eiIvPjwvc3ZnPg==",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    this.#map.on("click", (e) => {
      latInput.value = e.latlng.lat;
      lonInput.value = e.latlng.lng;

      if (this.#marker) this.#map.removeLayer(this.#marker);
      this.#marker = L.marker(e.latlng, { icon: customIcon }).addTo(this.#map);

      this.#marker.bindPopup("Lokasi cerita dipilih").openPopup();
    });
  }

  #restoreMapMarker() {
    if (!this.#map) return;

    const latInput = document.getElementById("lat");
    const lonInput = document.getElementById("lon");

    // If coordinates are already stored, display marker
    if (latInput.value && lonInput.value) {
      const lat = parseFloat(latInput.value);
      const lon = parseFloat(lonInput.value);

      if (!isNaN(lat) && !isNaN(lon)) {
        // Create custom icon for marker
        const customIcon = L.icon({
          iconUrl:
            "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48IS0tIUZvbnQgQXdlc29tZSBGcmVlIDYuNS4xIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlL2ZyZWUgQ29weXJpZ2h0IDIwMjQgRm9udGljb25zLCBJbmMuLS0+PHBhdGggZmlsbD0iI2Q5NzcwNiIgZD0iTTIxNS43IDQ5OS4yQzI2Ny4yIDQzNSAzODQgMjc5LjQgMzg0IDE5MkMzODQgODYgMjk4IDAgMTkyIDBTMCA4NiAwIDE5MmMwIDg3LjQgMTE2LjggMjQzIDIxNi4zIDMwNy4yYzUuOCA0LjAgMTMuNiA0LjAgMTkuNCAwek0xOTIgMTI4YTY0IDY0IDAgMSAxIDAgMTI4IDY0IDY0IDAgMSAxIDAtMTI4eiIvPjwvc3ZnPg==",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });

        this.#marker = L.marker([lat, lon], { icon: customIcon }).addTo(
          this.#map
        );
        this.#marker.bindPopup("Lokasi cerita dipilih").openPopup();
        this.#map.setView([lat, lon], 13);
      }
    }
  }

  capturePhoto() {
    const video = document.getElementById("camera");
    const canvas = document.getElementById("snapshot");
    const previewContainer = document.getElementById("preview-container");
    const preview = document.getElementById("preview");
    const takePhotoBtn = document.getElementById("take-photo");
    const fileInput = document.getElementById("file-input");

    // Check if using file input (camera not available)
    if (!video || video.style.display === "none") {
      // If file is already selected
      if (fileInput && fileInput.files.length > 0) {
        return this.#photoData;
      }

      // Otherwise, trigger file input
      if (fileInput) {
        fileInput.click();
      }
      return null;
    }

    // Capture from camera
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg");

    // Store photo data
    this.#photoData = dataUrl;

    // Update button text
    takePhotoBtn.textContent = "Ganti Foto";

    // Show preview
    preview.src = dataUrl;
    previewContainer.style.display = "block";

    // Notify presenter
    if (this.#callbacks.onPhotoCapture) {
      this.#callbacks.onPhotoCapture(dataUrl);
    }

    return dataUrl;
  }

  #handleSubmit(e) {
    e.preventDefault();

    const description = document.getElementById("description").value;
    const lat = document.getElementById("lat").value || null;
    const lon = document.getElementById("lon").value || null;
    const fileInput = document.getElementById("file-input");

    // Prepare file data from input if available
    let fileData = null;
    if (fileInput && fileInput.files.length > 0) {
      // We'll use the stored photoData since it's already processed by the file input handler
      fileData = this.#photoData;
    }

    // Forward to presenter via callback
    if (this.#callbacks.onSubmit) {
      this.#callbacks.onSubmit({
        description,
        lat,
        lon,
        fileData,
      });
    }
  }

  cleanupResources() {
    // Stop camera stream if active
    if (this.#stream) {
      this.#stream.getTracks().forEach((track) => track.stop());
      this.#stream = null;
      console.log("Camera stream stopped");
    }
  }

  showLoading() {
    const submitBtn = document.querySelector(
      "#story-form button[type='submit']"
    );
    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim...";
  }

  hideLoading() {
    const submitBtn = document.querySelector(
      "#story-form button[type='submit']"
    );
    submitBtn.disabled = false;
    submitBtn.textContent = "Kirim Cerita";
  }

  showSuccessMessage(message) {
    alert(message || "Cerita berhasil dikirim!");
  }

  showErrorMessage(message) {
    alert(message || "Gagal mengirim cerita");
  }
}

export default AddStoryView;
