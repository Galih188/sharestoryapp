import CONFIG from "../config";
import { getToken } from "../utils";
import {
  saveStories,
  saveStory,
  getAllStories,
  getStoryById as getStoryByIdFromDB,
  deleteStory,
} from "../utils/indexed-db";

class StoryModel {
  async getStories() {
    try {
      // Mencoba mengambil data dari server terlebih dahulu
      const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengambil cerita.");
      }

      const { listStory } = await response.json();

      // Simpan ke IndexedDB untuk penggunaan offline
      await saveStories(listStory);

      return listStory;
    } catch (error) {
      console.error("Error fetching stories:", error);

      // Jika gagal ambil dari API, mencoba ambil dari IndexedDB
      console.log("Trying to fetch stories from IndexedDB...");
      const storiesFromDB = await getAllStories();

      if (storiesFromDB && storiesFromDB.length > 0) {
        console.log("Success fetching stories from IndexedDB");
        return storiesFromDB;
      }

      throw new Error("Gagal mengambil cerita dari API dan database lokal");
    }
  }

  async getStoryById(id) {
    try {
      // Mencoba ambil data dari server terlebih dahulu
      const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengambil detail cerita.");
      }

      const { story } = await response.json();

      // Simpan ke IndexedDB
      await saveStories(story);

      return story;
    } catch (error) {
      console.error("Error fetching story by id:", error);

      // Jika gagal ambil dari API, coba ambil dari IndexedDB
      console.log("Trying to fetch story from IndexedDB...");
      const storyFromDB = await getStoryByIdFromDB(id);

      if (storyFromDB) {
        console.log("Success fetching story from IndexedDB");
        return storyFromDB;
      }

      throw new Error(
        "Gagal mengambil detail cerita dari API dan database lokal"
      );
    }
  }

  async postStory({ description, photo, lat, lon }) {
    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photo);

      if (lat && lon) {
        formData.append("lat", lat);
        formData.append("lon", lon);
      }

      const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      // Jika berhasil post, update data di IndexedDB
      // Refresh data stories
      this.getStories();

      return result;
    } catch (error) {
      console.error("Error posting story:", error);
      throw error;
    }
  }

  // Method bookmark
  async getStoriesFromLocal() {
    try {
      const stories = await getAllStories();
      return stories;
    } catch (error) {
      console.error("Gagal mengambil cerita dari IndexedDB:", error);
      throw error;
    }
  }

  // Menambahkan method untuk menghapus story (offline/lokal)
  async deleteStoryFromLocal(id) {
    try {
      await deleteStory(id);
      return {
        success: true,
        message: "Berhasil menghapus cerita dari penyimpanan lokal",
      };
    } catch (error) {
      console.error("Error deleting story from local:", error);
      throw new Error("Gagal menghapus cerita dari penyimpanan lokal");
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  }

  async register(name, email, password) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    } catch (error) {
      console.error("Error during registration:", error);
      throw error;
    }
  }

  // Menambahkan fungsi untuk menyimpan cerita lokal
  async saveLocalStory(story) {
    try {
      await saveStory(story);
      return {
        success: true,
        message: "Cerita berhasil disimpan secara lokal",
      };
    } catch (error) {
      console.error("Error saving local story:", error);
      throw new Error("Gagal menyimpan cerita secara lokal");
    }
  }

  // Menambahkan fungsi untuk mengumpulkan dan mengirim cerita yang tertunda
  async syncPendingStories() {
    try {
      // Ambil semua cerita dari IndexedDB
      const allStories = await getAllStories();

      // Filter untuk mendapatkan cerita yang pending
      const pendingStories = allStories.filter((story) => story.isPending);

      if (pendingStories.length === 0) return { synced: 0 };

      let syncedCount = 0;

      // Kirim masing-masing cerita ke server
      for (const story of pendingStories) {
        try {
          // Convert data URL ke File object
          const photoBlob = await fetch(story.photoUrl).then((res) =>
            res.blob()
          );
          const photoFile = new File([photoBlob], "photo.jpg", {
            type: "image/jpeg",
          });

          // Kirim ke server
          await this.postStory({
            description: story.description,
            photo: photoFile,
            lat: story.lat,
            lon: story.lon,
          });

          // Hapus dari penyimpanan lokal setelah berhasil dikirim
          await deleteStory(story.id);

          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync story ${story.id}:`, error);
          // Lanjutkan ke cerita berikutnya meskipun gagal
        }
      }

      return {
        synced: syncedCount,
        total: pendingStories.length,
        message: `Berhasil menyinkronkan ${syncedCount} dari ${pendingStories.length} cerita`,
      };
    } catch (error) {
      console.error("Error syncing pending stories:", error);
      throw error;
    }
  }
}

export default StoryModel;
