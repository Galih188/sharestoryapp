class AddStoryPresenter {
  #model;
  #view;
  #photoData;
  #isOffline;

  constructor({ model, view }) {
    this.#model = model;
    this.#view = view;
    this.#photoData = null;

    // Menambahkan listener untuk status online/offline
    window.addEventListener("online", () => {
      this.#isOffline = false;
      this.#view.updateNetworkStatus(false);
    });

    window.addEventListener("offline", () => {
      this.#isOffline = true;
      this.#view.updateNetworkStatus(true);
    });
  }

  async init() {
    try {
      // Initialize view
      this.#view.init({
        onPhotoCapture: (photoData) => this.setPhotoData(photoData),
        onSubmit: (data) => this.submitStory(data),
      });

      // Initialize camera lewat view
      await this.#view.initCamera();

      // Initialize map lewat view
      this.#view.initMap();
    } catch (error) {
      console.error("Error initializing add story page:", error);
      this.#view.showErrorMessage(
        "Gagal menginisialisasi halaman. Silakan coba lagi."
      );
    }
  }

  setPhotoData(photoData) {
    this.#photoData = photoData;
  }

  getPhotoData() {
    return this.#photoData;
  }

  async submitStory({ description, lat, lon, fileData }) {
    try {
      this.#view.showLoading();

      let photoData = this.#photoData || fileData;

      if (!photoData) {
        throw new Error("Silakan ambil foto atau pilih file terlebih dahulu");
      }

      // Convert data URL ke File object
      const photoBlob = await fetch(photoData).then((res) => res.blob());
      const photoFile = new File([photoBlob], "photo.jpg", {
        type: "image/jpeg",
      });

      // Cek koneksi internet
      if (this.#isOffline) {
        // Tampilkan pesan bahwa data akan disimpan lokal
        this.#view.showWarningMessage(
          "Anda sedang offline. Cerita akan disimpan lokal dan akan dikirim saat online."
        );

        // Buat ID sementara
        const tempId = "temp_" + new Date().getTime();

        // Buat objek story lokal
        const localStory = {
          id: tempId,
          name: localStorage.getItem("userName") || "User",
          description,
          photoUrl: photoData, // Simpan data URL langsung
          createdAt: new Date().toISOString(),
          lat: lat || null,
          lon: lon || null,
          isPending: true, // Tandai bahwa cerita belum dikirim ke server
        };

        // Simpan ke storage lokal dengan API IndexedDB
        await this.#model.saveLocalStory(localStory);

        this.#view.showSuccessMessage(
          "Cerita berhasil disimpan di penyimpanan lokal"
        );
      } else {
        // Submit story lewat model
        const result = await this.#model.postStory({
          description,
          photo: photoFile,
          lat: lat,
          lon: lon,
        });

        this.#view.showSuccessMessage(result.message);
      }

      this.cleanup();

      setTimeout(() => {
        window.location.hash = "/";
      }, 500);
    } catch (error) {
      this.#view.showErrorMessage(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }

  cleanup() {
    this.#view.cleanupResources();
  }
}

export default AddStoryPresenter;
