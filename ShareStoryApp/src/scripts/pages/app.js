import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import "leaflet/dist/leaflet.css";
import {
  setupSkipToContent,
  transitionHelper,
  isServiceWorkerAvailable,
} from "../utils";
import {
  generateSubscribeButtonTemplate,
  generateUnsubscribeButtonTemplate,
} from "../push-notification";
import {
  subscribe,
  unsubscribe,
  isCurrentPushSubscriptionAvailable,
} from "../utils/notification-helper";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #currentPage = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    // Supaya konten dapat difokuskan tapi tidak dalam urutan tab secara default
    this.#content.setAttribute("tabindex", "-1");

    this._setupDrawer();
    this._updateNavigation();

    // Skip langsung ke konten
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      setupSkipToContent(skipLink, this.#content);
    }

    // Menangani hashchange untuk membersihkan halaman sebelumnya
    window.addEventListener("hashchange", () => {
      if (
        this.#currentPage &&
        typeof this.#currentPage.cleanup === "function"
      ) {
        this.#currentPage.cleanup();
      }
    });
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  _updateNavigation() {
    const token = localStorage.getItem("token");
    const navList = document.getElementById("nav-list");

    if (!navList) return;

    // Untuk autetikasi user
    if (token) {
      navList.innerHTML = `
        <li><a href="#" id="push-notification-tools" class="push-notification-tools"></a></li>
        <li><a href="#/">Beranda</a></li>
        <li><a href="#/about">About</a></li>
        <li><a href="#/bookmarks">Bookmark</a></li>
        <li><a href="#/add">Tambah Cerita</a></li>
        <li><a href="#" id="logout-btn">Logout</a></li>
      `;

      // Menambahkan fungsi logout
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this._handleLogout();
        });
      }
    }
    // Untuk non-autentikasi user
    else {
      navList.innerHTML = `
        <li><a href="#/">Beranda</a></li>
        <li><a href="#/about">About</a></li>
        <li><a href="#/login">Login</a></li>
        <li><a href="#/register">Register</a></li>
      `;
    }
  }

  _handleLogout() {
    localStorage.removeItem("token");
    window.location.hash = "/login";
    this._updateNavigation();
  }

  // Push Notification
  async #setupPushNotification() {
    const pushNotificationTools = document.getElementById(
      "push-notification-tools"
    );

    if (!pushNotificationTools) return;

    const isSubscribed = await isCurrentPushSubscriptionAvailable();

    if (isSubscribed) {
      pushNotificationTools.innerHTML = generateUnsubscribeButtonTemplate();

      // Menambahkan event listener untuk unsubscribe button
      const unsubscribeButton = document.getElementById("unsubscribe-button");
      if (unsubscribeButton) {
        unsubscribeButton.addEventListener("click", async () => {
          const success = await unsubscribe();
          if (success) {
            // Refresh tampilan tools jika berhasil unsubscribe
            this.#setupPushNotification();
          }
        });
      }

      return;
    }

    pushNotificationTools.innerHTML = generateSubscribeButtonTemplate();
    const subscribeButton = document.getElementById("subscribe-button");
    if (subscribeButton) {
      subscribeButton.addEventListener("click", async () => {
        const success = await subscribe();
        if (success) {
          // Refresh tampilan tools jika berhasil subscribe
          this.#setupPushNotification();
        }
      });
    }
  }

  async renderPage() {
    try {
      const url = getActiveRoute();
      const page = routes[url];

      if (!page) {
        this._renderNotFoundPage();
        return;
      }

      // Mengupdate navigasi sebelum render page
      this._updateNavigation();

      // Pengecekan jika halaman butuh autentikasi
      if (!this._handleAuthCheck(url)) {
        return;
      }

      // Cleanup halaman sebelumnya jika ada
      if (
        this.#currentPage &&
        typeof this.#currentPage.cleanup === "function"
      ) {
        this.#currentPage.cleanup();
      }

      const transition = transitionHelper({
        updateDOM: async () => {
          this.#content.innerHTML = await page.render();
          await page.afterRender();
          this.#currentPage = page; // Simpan referensi halaman saat ini
        },
      });

      transition.ready.catch(console.error);
      transition.updateCallbackDone.then(() => {
        scrollTo({ top: 0, behavior: "instant" });
        this._setupNavigationList();

        // Periksa token sebelum memanggil setupPushNotification
        const token = localStorage.getItem("token");
        if (token && isServiceWorkerAvailable()) {
          this.#setupPushNotification();
        }
      });
    } catch (error) {
      console.error("Error rendering page:", error);
      this._renderErrorPage();
    }
  }

  _renderNotFoundPage() {
    this.#content.innerHTML = `
      <section class="container">
        <h1>404 - Halaman Tidak Ditemukan</h1>
        <p>Halaman yang Anda cari tidak ada.</p>
        <a href="#/">Kembali ke Beranda</a>
      </section>
    `;
  }

  _renderErrorPage() {
    this.#content.innerHTML = `
      <section class="container">
        <h1>Terjadi Kesalahan</h1>
        <p>Maaf, terjadi kesalahan dalam memuat halaman. Silakan coba lagi nanti.</p>
      </section>
    `;
  }

  _handleAuthCheck(url) {
    const token = localStorage.getItem("token");
    const authRequiredPages = ["/add"];
    const nonAuthPages = ["/login", "/register"];

    if (authRequiredPages.includes(url) && !token) {
      // Mengarahkan ke halaman login jika belum login
      alert("Silakan login terlebih dahulu");
      window.location.hash = "/login";
      return false;
    }

    if (nonAuthPages.includes(url) && token) {
      // Mengarahkan ke beranda jika sudah login
      window.location.hash = "/";
      return false;
    }

    return true;
  }

  _setupNavigationList() {
    // Metode ini dipanggil setelah perenderan halaman untuk memastikan item navigasi baru diatur dengan benar
    this._updateNavigation();
  }
}

export default App;
