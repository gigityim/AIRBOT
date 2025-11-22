// ===============================
//  前端演示用账号（仅示例）
// ===============================
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

// ===============================
//  登录状态管理（仅前端演示）
// ===============================
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

// ===============================
//  DOM 事件绑定
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    // 初始刷新 UI（根据 localStorage 恢复登录状态）
    authManager.updateUI();

    // --- 登录模态框控制 ---
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
        // 清空输入
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

    // 点击遮罩关闭
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // 登录表单提交
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

    // 退出登录
    logoutButtons.forEach((btn) => {
        btn.addEventListener("click", () => authManager.logout());
    });

    // ===============================
    //  导航滚动高亮
    // ===============================
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
});
