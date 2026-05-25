const internalUsers = {
    admin: {
        password: "admin2024",
        role: "admin",
        displayName: "管理员",
    },
    member: {
        password: "member2024",
        role: "member",
        displayName: "实验室成员",
    },
};

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loadUserFromStorage();
    }

    loadUserFromStorage() {
        try {
            const raw = localStorage.getItem("lab_currentUser");
            if (!raw) return;
            const user = JSON.parse(raw);
            if (user && internalUsers[user.username]) {
                this.currentUser = user;
            } else {
                this.currentUser = null;
                localStorage.removeItem("lab_currentUser");
            }
        } catch (e) {
            console.warn("加载本地登录状态失败：", e);
            this.currentUser = null;
        }
    }

    saveUserToStorage() {
        if (!this.currentUser) return;
        localStorage.setItem("lab_currentUser", JSON.stringify(this.currentUser));
    }

    clearStorage() {
        localStorage.removeItem("lab_currentUser");
    }

    login(username, password) {
        const user = internalUsers[username];
        if (!user) return false;
        if (user.password !== password) return false;

        this.currentUser = {
            username,
            role: user.role,
            displayName: user.displayName,
        };
        this.saveUserToStorage();
        this.updateUI();
        return true;
    }

    logout() {
        this.currentUser = null;
        this.clearStorage();
        this.updateUI();
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    updateUI() {
        const guestMenu = document.querySelector('[data-role="guest-menu"]');
        const userMenu = document.querySelector('[data-role="user-menu"]');
        const usernameSpan = document.querySelector('[data-role="username-display"]');
        const protectedBlocks = document.querySelectorAll(".protected-content");

        if (this.isAuthenticated()) {
            if (guestMenu) guestMenu.style.display = "none";
            if (userMenu) userMenu.style.display = "flex";
            if (usernameSpan) {
                usernameSpan.textContent =
                    this.currentUser.displayName || this.currentUser.username;
            }
            protectedBlocks.forEach((el) => el.classList.add("is-visible"));
        } else {
            if (guestMenu) guestMenu.style.display = "block";
            if (userMenu) userMenu.style.display = "none";
            protectedBlocks.forEach((el) => el.classList.remove("is-visible"));
        }
    }
}

const authManager = new AuthManager();

document.addEventListener("DOMContentLoaded", () => {
    authManager.updateUI();

    const modal = document.getElementById("loginModal");
    const openButtons = document.querySelectorAll('[data-role="open-login"]');
    const closeButtons = document.querySelectorAll('[data-role="close-login"]');
    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");
    const logoutButtons = document.querySelectorAll('[data-role="logout"]');

    const openModal = () => {
        if (!modal) return;
        modal.classList.add("is-open");
        loginError && (loginError.hidden = true);
        const userInput = document.getElementById("loginUsername");
        const pwdInput = document.getElementById("loginPassword");
        if (userInput) userInput.value = "";
        if (pwdInput) pwdInput.value = "";
        userInput && userInput.focus();
    };

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove("is-open");
    };

    openButtons.forEach((btn) => {
        btn.addEventListener("click", openModal);
    });

    closeButtons.forEach((btn) => {
        btn.addEventListener("click", closeModal);
    });

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = loginForm.username.value.trim();
            const password = loginForm.password.value;

            const success = authManager.login(username, password);
            if (success) {
                if (loginError) loginError.hidden = true;
                closeModal();
            } else {
                if (loginError) loginError.hidden = false;
            }
        });
    }

    logoutButtons.forEach((btn) => {
        btn.addEventListener("click", () => authManager.logout());
    });

    const sections = document.querySelectorAll(
        ".section[id], .address-section[id]"
    );
    const navLinks = document.querySelectorAll(".top-nav a");

    const updateActiveNav = () => {
        const scrollY = window.scrollY;
        let currentId = null;

        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const offsetTop = rect.top + window.scrollY;
            const sectionHeight = rect.height;

            if (
                scrollY >= offsetTop - 160 &&
                scrollY < offsetTop + sectionHeight - 160
            ) {
                currentId = section.id;
            }
        });

        navLinks.forEach((link) => {
            const href = link.getAttribute("href") || "";
            const hash = href.startsWith("#") ? href.slice(1) : null;
            link.classList.toggle("active", hash === currentId);
        });
    };

    updateActiveNav();
    window.addEventListener("scroll", updateActiveNav);

    const scrollToTopBtn = document.getElementById("scrollToTop");

    const toggleScrollToTop = () => {
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add("visible");
        } else {
            scrollToTopBtn.classList.remove("visible");
        }
    };

    window.addEventListener("scroll", toggleScrollToTop);

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, observerOptions);

    document.querySelectorAll(".card, .section, .award-item").forEach(el => {
        observer.observe(el);
    });
});
