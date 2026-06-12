// 1. 后端 API 基础地址
const API_BASE_URL = "https://api.airbot.top/api";

// ==========================================
// 身份验证与 Token 管理器
// ==========================================
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loadUserFromStorage();
    }

    loadUserFromStorage() {
        try {
            const raw = localStorage.getItem("lab_currentUser");
            if (!raw) return;
            this.currentUser = JSON.parse(raw);
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

    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = {
                    username,
                    role: "member",
                    displayName: username,
                    token: data.token // 核心：保存后端发来的 JWT 钥匙
                };
                this.saveUserToStorage();
                return { success: true, message: data.message };
            } else {
                const errorData = await response.json();
                return { success: false, message: errorData.detail || "用户名或密码错误" };
            }
        } catch (error) {
            console.error("网络请求失败：", error);
            return { success: false, message: "无法连接到服务器，请检查后端是否运行" };
        }
    }

    logout() {
        this.currentUser = null;
        this.clearStorage();
        showNotification("已安全退出登录", "info");
        updateAuthUI(); // 更新界面按钮
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

const authManager = new AuthManager();

// ==========================================
// 页面初始化
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initMobileMenu();
    initLoginModal();
    initScrollToTop();
    initContactForm();
    
    // 动态拉取数据库公开数据
    loadDynamicProjects();
    loadDynamicMembers();
    
    // 初始化 UI 状态（根据是否登录改变按钮文字）
    updateAuthUI();
    initSectionAnimations();
});

// ==========================================
// UI 状态切换 (未登录 vs 已登录)
// ==========================================
function updateAuthUI() {
    const loginBtn = document.getElementById("loginBtn");
    const mobileLoginBtn = document.querySelector(".mobile-login-btn");
    
    if (authManager.isAuthenticated()) {
        loginBtn.textContent = "内部资源";
        if(mobileLoginBtn) mobileLoginBtn.textContent = "内部资源";
    } else {
        loginBtn.textContent = "内部登录";
        if(mobileLoginBtn) mobileLoginBtn.textContent = "内部登录";
    }
}

// ==========================================
// 动态渲染：产品中心与成员风采
// ==========================================
async function loadDynamicProjects() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    try {
        const response = await fetch(`${API_BASE_URL}/projects`);
        if (response.ok) {
            const result = await response.json();
            if (result.code === 200 && result.data.length > 0) {
                productsGrid.innerHTML = ''; 
                result.data.forEach(project => {
                    const card = document.createElement('div');
                    card.className = 'product-card';
                    card.style.opacity = "0";
                    card.style.transform = "translateY(30px)";
                    
                    const specsHtml = project.specs.split('|').map(s => `<span>${s.trim()}</span>`).join('');
                    card.innerHTML = `
                        <div class="product-image">
                            <img src="${project.image_url}" alt="${project.title}" onerror="this.src='picture/1.jpg'" />
                        </div>
                        <div class="product-info">
                            <h3>${project.title}</h3>
                            <p>${project.description}</p>
                            <div class="product-specs">${specsHtml}</div>
                            <button class="product-btn">了解详情 →</button>
                        </div>
                    `;
                    productsGrid.appendChild(card);
                });
                initSectionAnimations();
            }
        }
    } catch (error) { console.error('动态加载项目失败:', error); }
}

async function loadDynamicMembers() {
    const membersGrid = document.querySelector('.members-grid');
    if (!membersGrid) return;

    try {
        const response = await fetch(`${API_BASE_URL}/members`);
        if (response.ok) {
            const result = await response.json();
            if (result.code === 200 && result.data.length > 0) {
                membersGrid.innerHTML = ''; 
                result.data.forEach(member => {
                    const card = document.createElement('div');
                    card.className = 'feature-item'; 
                    card.style.opacity = "0";
                    card.style.transform = "translateY(30px)";
                    card.style.minWidth = "250px";
                    card.style.flex = "1";
                    
                    card.innerHTML = `
                        <div class="feature-number" style="font-size: 1.8rem; color: var(--primary-color);">${member.name}</div>
                        <div class="feature-label" style="font-weight: bold; margin: 10px 0; color: white;">${member.role}</div>
                        <p style="font-size: 0.95rem; color: #a0aec0; margin-top: 10px; line-height: 1.5;">${member.description}</p>
                    `;
                    membersGrid.appendChild(card);
                });
                initSectionAnimations();
            }
        }
    } catch (error) { console.error('动态加载成员失败:', error); }
}

// ==========================================
// 登录与资源面板交互逻辑
// ==========================================
function initLoginModal() {
    const loginBtn = document.getElementById("loginBtn");
    const mobileLoginBtn = document.querySelector(".mobile-login-btn");
    const modal = document.getElementById("loginModal");
    const modalClose = document.getElementById("modalClose");
    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");

    const openLoginModal = () => {
        modal.classList.add("is-open");
        loginError.hidden = true;
        document.body.style.overflow = "hidden";
    };

    const closeLoginModal = () => {
        modal.classList.remove("is-open");
        document.body.style.overflow = "";
    };

    // 核心修改：点击按钮时判断状态
    const handleAuthClick = () => {
        if (authManager.isAuthenticated()) {
            openResourcePanel(); // 已登录则打开内部资源面板
        } else {
            openLoginModal();    // 未登录则打开登录框
        }
    };

    loginBtn.addEventListener("click", handleAuthClick);
    if(mobileLoginBtn) {
        mobileLoginBtn.addEventListener("click", () => {
            handleAuthClick();
            closeMobileMenu();
        });
    }
    
    modalClose.addEventListener("click", closeLoginModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeLoginModal(); });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = loginForm.username.value.trim();
        const password = loginForm.password.value;
        const submitBtn = loginForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = '验证中...';
        submitBtn.disabled = true;

        const result = await authManager.login(username, password);

        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        if (result.success) {
            closeLoginModal();
            loginForm.reset();
            updateAuthUI();
            showNotification(result.message, "success");
        } else {
            loginError.textContent = result.message;
            loginError.hidden = false;
        }
    });
}

// ==========================================
// 内部机密资源面板 (纯 JS 动态生成)
// ==========================================
async function openResourcePanel() {
    // 创建一个全屏弹窗
    let panel = document.getElementById("resourcePanel");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "resourcePanel";
        panel.className = "modal";
        panel.innerHTML = `
            <div class="modal-content" style="max-width: 600px; text-align: left;">
                <button class="modal-close" onclick="document.getElementById('resourcePanel').classList.remove('is-open'); document.body.style.overflow='';">&times;</button>
                <h2 style="margin-bottom: 20px; color: var(--primary-color);">实验室内部控制台</h2>
                <div id="secretLinksArea">加载机密数据中...</div>
                
                <h3 style="margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 5px;">机密文件下载</h3>
                <button onclick="downloadSecretFile('内部通讯录.txt')" class="btn-secondary" style="width: 100%; margin-bottom: 20px;">下载《内部通讯录.txt》</button>
                
                <button onclick="authManager.logout(); document.getElementById('resourcePanel').classList.remove('is-open');" class="submit-btn" style="background: #ff4d4f; color: white;">退出登录</button>
            </div>
        `;
        document.body.appendChild(panel);
    }

    panel.classList.add("is-open");
    document.body.style.overflow = "hidden";
    
    // 携带 JWT 钥匙向后端请求机密网址
    const linksArea = document.getElementById("secretLinksArea");
    try {
        const response = await fetch(`${API_BASE_URL}/secret-links`, {
            headers: { 'Authorization': `Bearer ${authManager.currentUser.token}` }
        });
        
        if (response.ok) {
            const result = await response.json();
            let html = `<p style="color: #a0aec0; margin-bottom: 15px;">欢迎回来，权限级别：核心成员</p><ul style="list-style: none; padding: 0;">`;
            result.data.forEach(link => {
                html += `<li style="margin-bottom: 10px;">🔗 <a href="${link.url}" target="_blank" style="color: #00d4ff; text-decoration: none;">${link.name}</a></li>`;
            });
            html += `</ul>`;
            linksArea.innerHTML = html;
        } else {
            if (response.status === 401) {
                authManager.logout();
                panel.classList.remove("is-open");
                showNotification("登录状态已过期，请重新登录", "error");
            } else {
                linksArea.innerHTML = "<p style='color: red;'>获取数据失败，请检查网络</p>";
            }
        }
    } catch (e) {
        linksArea.innerHTML = "<p style='color: red;'>无法连接到安全服务器</p>";
    }
}

// ==========================================
// 加密文件下载逻辑
// ==========================================
async function downloadSecretFile(filename) {
    if (!authManager.isAuthenticated()) {
        showNotification("请先进行内部登录！", "error");
        return;
    }
    const token = authManager.currentUser.token;
    showNotification("正在请求最高权限数据，请稍候...", "info");

    try {
        const response = await fetch(`${API_BASE_URL}/download/${filename}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showNotification("机密文件下载成功！", "success");
        } else {
            const errorData = await response.json();
            showNotification(errorData.detail || "下载失败，权限不足或文件不存在", "error");
        }
    } catch (error) {
        console.error("下载请求失败:", error);
        showNotification("网络错误，无法连接到安全服务器", "error");
    }
}

// ==========================================
// 其他基础交互与动画函数
// ==========================================
function initNavbar() { /* 原有逻辑不变 */
    const navbar = document.querySelector(".navbar");
    const navLinks = document.querySelectorAll(".nav-links a, .mobile-menu a");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) navbar.classList.add("scrolled");
        else navbar.classList.remove("scrolled");
        updateActiveNav();
    });
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const href = link.getAttribute("href");
            if (href.startsWith("#")) {
                const target = document.querySelector(href);
                if (target) { target.scrollIntoView({ behavior: "smooth" }); closeMobileMenu(); }
            }
        });
    });
    function updateActiveNav() {
        const sections = document.querySelectorAll("section[id]");
        let currentSection = "";
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) currentSection = section.id;
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
    if(mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => { mobileMenu.style.display = mobileMenu.style.display === "flex" ? "none" : "flex"; });
    }
    document.addEventListener("click", (e) => {
        if (mobileMenu && !mobileMenu.contains(e.target) && mobileMenuBtn && !mobileMenuBtn.contains(e.target)) closeMobileMenu();
    });
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById("mobileMenu");
    if(mobileMenu) mobileMenu.style.display = "none";
}

function initScrollToTop() {
    const scrollBtn = document.getElementById("scrollToTop");
    window.addEventListener("scroll", () => { scrollBtn.classList.toggle("visible", window.scrollY > 500); });
    scrollBtn.addEventListener("click", () => { window.scrollTo({ top: 0, behavior: "smooth" }); });
}

function initContactForm() {
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault(); 
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '发送中...';
            submitBtn.disabled = true;

            const formData = {
                name: contactForm.name.value,
                email: contactForm.email.value,
                phone: contactForm.phone.value || "",
                message: contactForm.message.value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (response.ok) {
                    const data = await response.json();
                    showNotification(data.message, "success");
                    contactForm.reset();
                } else { showNotification("服务器繁忙，留言失败", "error"); }
            } catch (error) { showNotification("无法连接到服务器", "error"); } 
            finally { submitBtn.textContent = originalText; submitBtn.disabled = false; }
        });
    }
}

function initSectionAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, observerOptions);
    document.querySelectorAll(".product-card, .research-card, .award-item, .feature-item, .about-text").forEach(el => {
        el.style.transition = "all 0.6s ease-out";
        observer.observe(el);
    });
}

function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => { notification.classList.add("show"); }, 10);
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement("style");
style.textContent = `
    .notification { position: fixed; top: 100px; right: 30px; padding: 15px 25px; border-radius: 12px; font-size: 15px; font-weight: 500; z-index: 3000; transform: translateX(150%); opacity: 0; transition: all 0.3s ease; }
    .notification.show { transform: translateX(0); opacity: 1; }
    .notification-success { background: linear-gradient(135deg, #00ff88, #00cc6a); color: #0a0e17; }
    .notification-error { background: linear-gradient(135deg, #ff4d4f, #cc0000); color: white; }
    .notification-info { background: linear-gradient(135deg, #00d4ff, #0099cc); color: #0a0e17; }
`;
document.head.appendChild(style);
