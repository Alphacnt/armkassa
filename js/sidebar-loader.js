class SidebarLoader {
    constructor() {
        this.sidebarContainer = null;
        this.currentPage = null;
        this.excludedPages = ['login.html', 'register.html'];
        
        // Проверка авторизации
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (!this.excludedPages.includes(currentPage) && sessionStorage.getItem('isLoggedIn') !== 'true') {
            console.log('User not logged in, redirecting to login');
            const isInPagesFolder = window.location.pathname.includes('/pages/');
            const loginPath = isInPagesFolder ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
            return;
        }

        // Объект с функциями инициализации для каждой страницы
        this.pageInitializers = {
            'index.html': () => {
                console.log('Initializing index.html (Payments page)');
                if (typeof window.setDefaultDates === 'function' && typeof window.loadPaymentsTable === 'function') {
                    window.setDefaultDates();
                    window.loadPaymentsTable();
                    if (window.currentObject) {
                        console.log('Restoring dashboard for:', window.currentObject);
                        window.showDashboard(window.currentObject);
                    }
                } else {
                    console.error('Payment page initialization functions not found');
                }
            },
            'services.html': () => {
                console.log('Initializing services.html');
                if (typeof window.initializeServicesPage === 'function') {
                    window.initializeServicesPage();
                } else {
                    console.error('initializeServicesPage not found');
                }
            },
            'orders.html': () => {
                console.log('Initializing orders.html');
                if (typeof window.initializeOrdersPage === 'function') {
                    window.initializeOrdersPage();
                } else {
                    console.error('initializeOrdersPage not found');
                }
            },
            'events.html': () => {
                console.log('Initializing events.html');
                if (typeof window.initializeEventsPage === 'function') {
                    window.initializeEventsPage();
                } else {
                    console.error('initializeEventsPage not found');
                }
            },
            'inventory.html': () => {
                console.log('Initializing inventory.html');
                if (typeof window.initializeInventoryPage === 'function') {
                    window.initializeInventoryPage();
                } else {
                    console.error('initializeInventoryPage not found');
                }
            },
            'references.html': () => {
                console.log('Initializing references.html');
                if (typeof window.initializeReferencesPage === 'function') {
                    window.initializeReferencesPage();
                } else {
                    console.error('initializeReferencesPage not found');
                }
            },
            'reports.html': () => {
                console.log('Initializing reports.html');
                if (typeof window.initializeReportsPage === 'function') {
                    window.initializeReportsPage();
                } else {
                    console.error('initializeReportsPage not found');
                }
            },
            'settings.html': () => {
                console.log('Initializing settings.html');
                if (typeof window.initializeSettingsPage === 'function') {
                    window.initializeSettingsPage();
                } else {
                    console.error('initializeSettingsPage not found');
                }
            }
        };
        this.init();
    }

    shouldLoadSidebar() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        return !this.excludedPages.includes(currentPage);
    }

    async init() {
        if (this.shouldLoadSidebar()) {
            await this.loadSidebar();
            this.initEventListeners();
            this.setActiveMenuItem();
            this.initSPANavigation();
        } else {
            console.log('Sidebar loading skipped for current page');
        }
    }

    async loadSidebar() {
        try {
            if (!document.getElementById('sidebar-container')) {
                const container = document.createElement('div');
                container.id = 'sidebar-container';
                document.body.insertBefore(container, document.body.firstChild);
                this.sidebarContainer = container;
            }

            const isInPagesFolder = window.location.pathname.includes('/pages/');
            const sidebarPath = isInPagesFolder ? '../components/sidebar.html' : 'components/sidebar.html';
            console.log('Attempting to load sidebar from:', sidebarPath);

            const response = await fetch(sidebarPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const sidebarHTML = await response.text();
            this.sidebarContainer.innerHTML = sidebarHTML;
            
            console.log('Sidebar loaded successfully');
        } catch (error) {
            console.error('Error loading sidebar:', error);
        }
    }

    initEventListeners() {
        const checkElements = () => {
            const toggleBtn = document.getElementById('toggleSidebar');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');

            if (toggleBtn && sidebar && overlay) {
                console.log('Sidebar elements found, adding event listeners');
                
                toggleBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Toggle button clicked');
                    this.toggleSidebar();
                });

                overlay.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('Overlay clicked');
                    this.closeSidebar();
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.closeSidebar();
                    }
                });

                this.initBootstrapCollapses();
            } else {
                console.error('Sidebar elements not found:', { toggleBtn, sidebar, overlay });
                setTimeout(checkElements, 100);
            }
        };

        checkElements();
    }

    initBootstrapCollapses() {
        const collapseElements = document.querySelectorAll('[data-bs-toggle="collapse"]');
        collapseElements.forEach(element => {
            element.addEventListener('click', (e) => {
                console.log('Collapse toggle clicked:', element.getAttribute('href'));
                const target = document.querySelector(element.getAttribute('href'));
                if (target) {
                    document.querySelectorAll('.submenu.show').forEach(submenu => {
                        if (submenu !== target) {
                            submenu.classList.remove('show');
                            const parentToggle = document.querySelector(`[href="#${submenu.id}"]`);
                            if (parentToggle) {
                                parentToggle.classList.add('collapsed');
                                parentToggle.setAttribute('aria-expanded', 'false');
                            }
                        }
                    });
                }
            });
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        if (sidebar && overlay) {
            const isActive = sidebar.classList.contains('active');
            if (isActive) {
                this.closeSidebar();
            } else {
                this.openSidebar();
            }
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const toggleBtn = document.getElementById('toggleSidebar');
        
        if (sidebar && overlay && toggleBtn) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            toggleBtn.classList.add('active');
            document.body.classList.add('sidebar-open');
            console.log('Sidebar opened');
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const toggleBtn = document.getElementById('toggleSidebar');
        
        if (sidebar && overlay && toggleBtn) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            toggleBtn.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            console.log('Sidebar closed');
        }
    }

    setActiveMenuItem() {
        setTimeout(() => {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const navLinks = document.querySelectorAll('.sidebar .nav-link');
            
            navLinks.forEach(link => link.classList.remove('active'));
            
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href === currentPage || (currentPage === 'index.html' && href === 'index.html'))) {
                    link.classList.add('active');
                    
                    const submenu = link.closest('.submenu');
                    if (submenu) {
                        submenu.classList.add('show');
                        const parentToggle = document.querySelector(`[href="#${submenu.id}"]`);
                        if (parentToggle) {
                            parentToggle.classList.remove('collapsed');
                            parentToggle.setAttribute('aria-expanded', 'true');
                        }
                    }
                }
            });
        }, 250);
    }

    initSPANavigation() {
        setTimeout(() => {
            const navLinks = document.querySelectorAll('.sidebar .nav-link[href$=".html"]');
            console.log('Found nav links:', navLinks.length);
            
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = link.getAttribute('href');
                    console.log('Nav link clicked:', href);
                    if (href && href.endsWith('.html')) {
                        if (href === 'login.html') {
                            console.log('Logout link clicked');
                            this.handleLogout();
                            return;
                        }
                        
                        if (href === 'index.html') {
                            const isInPagesFolder = window.location.pathname.includes('/pages/');
                            const indexPath = isInPagesFolder ? '../index.html' : 'index.html';
                            console.log('Navigating to index:', indexPath);
                            window.location.href = indexPath;
                            return;
                        }
                        
                        this.navigateToPage(href);
                        this.closeSidebar();
                    } else {
                        console.warn('Invalid or missing href for nav link:', link);
                    }
                });
            });

            window.addEventListener('popstate', (e) => {
                if (e.state && e.state.page) {
                    console.log('Popstate event, loading page:', e.state.page);
                    this.loadPageContent(e.state.page, false);
                }
            });
        }, 300);
    }

    handleLogout() {
        console.log('Performing logout');
        
        // Очистка данных авторизации
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.clear();

        // Отправка запроса на сервер (если требуется)
        fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
            }
        })
        .catch(error => console.error('Error during logout request:', error))
        .finally(() => {
            // Перенаправление на страницу логина
            const isInPagesFolder = window.location.pathname.includes('/pages/');
            const loginPath = isInPagesFolder ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
        });
    }

    async navigateToPage(href) {
        try {
            const fullPath = this.getCorrectPath(href);
            console.log('Navigating to:', fullPath);
            await this.loadPageContent(fullPath, true);
        } catch (error) {
            console.error('Navigation error:', error);
            window.location.href = href;
        }
    }

    getCorrectPath(href) {
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        
        if (isInPagesFolder) {
            if (href === 'index.html') {
                return '../index.html';
            } else if (href === 'login.html') {
                return 'login.html';
            } else if (!href.startsWith('../')) {
                return href;
            }
        } else {
            if (href === 'index.html') {
                return 'index.html';
            } else if (!href.startsWith('pages/')) {
                return `pages/${href}`;
            }
        }
        
        return href;
    }

    async loadPageContent(pagePath, addToHistory = true) {
        try {
            this.showLoadingIndicator();
            const versionedPath = `${pagePath}?v=${new Date().getTime()}`;
            console.log('Fetching page content:', versionedPath);
            const response = await fetch(versionedPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector('.main-content') || doc.querySelector('main') || doc.body;
            const currentContent = document.querySelector('.main-content') || document.querySelector('main');
            if (!newContent) {
                throw new Error('No content found in loaded page');
            }
            if (!currentContent) {
                throw new Error('No main-content or main element found in current page');
            }
            currentContent.style.opacity = '0';
            const scripts = doc.querySelectorAll('script[src]');
            const scriptPromises = Array.from(scripts).map(script => {
                return new Promise((resolve, reject) => {
                    const src = script.getAttribute('src');
                    const newScript = document.createElement('script');
                    newScript.src = src.startsWith('/') ? src : `/${src}`;
                    newScript.async = false;
                    newScript.onload = () => {
                        console.log('Script loaded:', src);
                        resolve();
                    };
                    newScript.onerror = () => {
                        console.error('Failed to load script:', src);
                        reject(new Error(`Failed to load script: ${src}`));
                    };
                    document.head.appendChild(newScript);
                });
            });
            await Promise.all(scriptPromises);
            console.log('All scripts loaded for:', pagePath);
            setTimeout(() => {
                currentContent.innerHTML = newContent.innerHTML;
                currentContent.style.opacity = '1';
                const newTitle = doc.querySelector('title');
                if (newTitle) {
                    document.title = newTitle.textContent;
                }
                if (addToHistory) {
                    const newUrl = this.getHistoryUrl(pagePath);
                    history.pushState({ page: pagePath }, '', newUrl);
                }
                this.setActiveMenuItem();
                this.hideLoadingIndicator();
                const pageName = pagePath.split('/').pop() || 'index.html';
                console.log('Attempting to initialize page:', pageName);
                setTimeout(() => {
                    if (this.pageInitializers[pageName]) {
                        console.log('Calling initializer for:', pageName);
                        this.pageInitializers[pageName]();
                    } else {
                        console.error(`No initializer found for page: ${pageName}`);
                        console.log('Available initializers:', Object.keys(this.pageInitializers));
                    }
                }, 100);
                console.log(`Page loaded: ${pagePath}`);
            }, 200);
        } catch (error) {
            console.error('Error loading page:', error);
            this.hideLoadingIndicator();
            window.location.href = pagePath;
        }
    }

    getHistoryUrl(pagePath) {
        if (pagePath.startsWith('../')) {
            return pagePath.replace('../', '');
        }
        return pagePath;
    }

    showLoadingIndicator() {
        if (!document.getElementById('loading-indicator')) {
            const loader = document.createElement('div');
            loader.id = 'loading-indicator';
            loader.innerHTML = `
                <div style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 255, 255, 0.9);
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <div style="
                        width: 20px;
                        height: 20px;
                        border: 2px solid #f3f3f3;
                        border-top: 2px solid #007bff;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                    <span>Загрузка...</span>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loader);
        }
    }

    hideLoadingIndicator() {
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.remove();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const excludedPages = ['login.html', 'register.html'];
    
    if (!excludedPages.includes(currentPage)) {
        console.log('DOM loaded, initializing SidebarLoader');
        new SidebarLoader();
    } else {
        console.log('SidebarLoader initialization skipped for:', currentPage);
    }
});