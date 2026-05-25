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
            }
        } catch (e) {
            console.warn("加载本地登录状态失败：", e);
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
        if (!user || user.password !== password) return false;
        
        this.currentUser = {
            username,
            role: user.role,
            displayName: user.displayName,
        };
        this.saveUserToStorage();
        return true;
    }

    logout() {
        this.currentUser = null;
        this.clearStorage();
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

const authManager = new AuthManager();

document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initMobileMenu();
    initLoginModal();
    initScrollToTop();
    initContactForm();
    initSectionAnimations();
});

function initNavbar() {
    const navbar = document.querySelector(".navbar");
    const navLinks = document.querySelectorAll(".nav-links a, .mobile-menu a");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
        updateActiveNav();
    });

    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const href = link.getAttribute("href");
            if (href.startsWith("#")) {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                    closeMobileMenu();
                }
            }
        });
    });

    function updateActiveNav() {
        const sections = document.querySelectorAll("section[id]");
        let currentSection = "";

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
                currentSection = section.id;
            }
        });

        navLinks.forEach(link => {
            const href = link.getAttribute("href");
            link.classList.toggle("active", href === `#${currentSection}`);
        });
    }
}

function initMobileMenu() {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileMenu = document.getElementById("mobileMenu");

    mobileMenuBtn.addEventListener("click", () => {
        mobileMenu.style.display = mobileMenu.style.display === "flex" ? "none" : "flex";
    });

    document.addEventListener("click", (e) => {
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            closeMobileMenu();
        }
    });
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById("mobileMenu");
    mobileMenu.style.display = "none";
}

function initLoginModal() {
    const loginBtn = document.getElementById("loginBtn");
    const mobileLoginBtn = document.querySelector(".mobile-login-btn");
    const modal = document.getElementById("loginModal");
    const modalClose = document.getElementById("modalClose");
    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");

    const openModal = () => {
        modal.classList.add("is-open");
        loginError.hidden = true;
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        modal.classList.remove("is-open");
        document.body.style.overflow = "";
    };

    loginBtn.addEventListener("click", openModal);
    mobileLoginBtn.addEventListener("click", () => {
        openModal();
        closeMobileMenu();
    });
    modalClose.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = loginForm.username.value.trim();
        const password = loginForm.password.value;

        if (authManager.login(username, password)) {
            closeModal();
            loginForm.reset();
            showNotification("登录成功！", "success");
        } else {
            loginError.hidden = false;
        }
    });
}

function initScrollToTop() {
    const scrollBtn = document.getElementById("scrollToTop");

    window.addEventListener("scroll", () => {
        scrollBtn.classList.toggle("visible", window.scrollY > 500);
    });

    scrollBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function initContactForm() {
    const contactForm = document.getElementById("contactForm");
    
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            showNotification("留言已发送，我们会尽快回复您！", "success");
            contactForm.reset();
        });
    }
}

function initSectionAnimations() {
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

    document.querySelectorAll(".product-card, .research-card, .award-item, .feature-item, .about-text").forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        el.style.transition = "all 0.6s ease-out";
        observer.observe(el);
    });
}

function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add("show");
    }, 10);

    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement("style");
style.textContent = `
    .notification {
        position: fixed;
        top: 100px;
        right: 30px;
        padding: 15px 25px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 500;
        z-index: 3000;
        transform: translateX(150%);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .notification-success {
        background: linear-gradient(135deg, #00ff88, #00cc6a);
        color: #0a0e17;
    }
    
    .notification-info {
        background: linear-gradient(135deg, #00d4ff, #0099cc);
        color: #0a0e17;
    }
`;
document.head.appendChild(style);
