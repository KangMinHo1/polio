/**
 * settings.js
 * 설정 페이지의 기능을 담당합니다. (테마 변경, 계정 관리 등)
 */
document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION; 
    
    const app = window.CommunityApp; 

    if (!app.state.user) { 
        app.utils.showNotification('설정 페이지에 접근하려면 로그인이 필요합니다.', 'warning'); 
        setTimeout(() => { window.location.href = 'login.html'; }, 1500); 
        return; 
    }
    
    const darkModeToggle = document.getElementById('dark-mode-toggle'); 
    const deleteAccountButton = document.getElementById('delete-account-button'); 
    const logoutButton = document.getElementById('logout-button'); 
    const passwordChangeForm = document.getElementById('password-change-form'); 
    const myPostsButton = document.getElementById('my-posts-button'); 

    function initializeSettingsPage() {
        setupEventListeners(); 
        loadThemeSetting(); 
        setMyPostsLink(); 
    }

    function setupEventListeners() {
        if (darkModeToggle) { darkModeToggle.addEventListener('change', (e) => toggleTheme(e.target.checked)); } 
        if (deleteAccountButton) { deleteAccountButton.addEventListener('click', handleDeleteAccount); } 
        if (logoutButton) { logoutButton.addEventListener('click', handleLogout); } 
        if (passwordChangeForm) { passwordChangeForm.addEventListener('submit', handleChangePassword); } 
        
        document.querySelectorAll('.password-toggle-icon').forEach(icon => {
            icon.addEventListener('click', (e) => { 
                const input = e.target.previousElementSibling; 
                if (input.type === 'password') { 
                    input.type = 'text'; 
                    e.target.textContent = '🙈'; 
                } else { 
                    input.type = 'password'; 
                    e.target.textContent = '👁️'; 
                }
            });
        });
    }

    function setMyPostsLink() {
        if (myPostsButton) { 
            // ✅ user.name -> user.id
            const currentUser = app.state.user.id; 
            myPostsButton.href = `posts.html?author=${encodeURIComponent(currentUser)}`;
        }
    }

    function toggleTheme(isDark) {
        document.documentElement.classList.toggle('dark', isDark); 
        localStorage.setItem('isDarkMode', isDark); 
        app.state.isDarkMode = isDark; 
        app.utils.showNotification(`테마가 ${isDark ? '다크 모드' : '라이트 모드'}로 변경되었습니다.`, 'info'); 
    }

    function loadThemeSetting() {
        if (darkModeToggle) { 
            darkModeToggle.checked = app.state.isDarkMode; 
        }
    }
    
    function handleLogout() {
        localStorage.removeItem('user'); 
        app.state.user = null; 
        app.utils.showNotification('로그아웃되었습니다.', 'info'); 
        setTimeout(() => { window.location.href = 'mainview.html'; }, 1000); 
    }

    async function handleChangePassword(e) {
        e.preventDefault(); 
        
        const currentPassword = document.getElementById('current-password').value; 
        const newPassword = document.getElementById('new-password').value; 
        const confirmPassword = document.getElementById('confirm-password').value; 

        const users = await app.api.fetchAllUsers();
        // ✅ user.name -> user.id
        const currentUserData = users.find(u => u.id === app.state.user.id); 

        if (currentUserData.password !== currentPassword) { 
            return app.utils.showNotification('현재 비밀번호가 일치하지 않습니다.', 'warning'); 
        }
        if (newPassword !== confirmPassword) { 
            return app.utils.showNotification('새 비밀번호가 일치하지 않습니다.', 'warning'); 
        }

        currentUserData.password = newPassword; 
        localStorage.setItem('users', JSON.stringify(users)); 

        app.utils.showNotification('비밀번호가 성공적으로 변경되었습니다.', 'success'); 
        passwordChangeForm.reset(); 
    }

    async function handleDeleteAccount() {
        if (confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) { 
            // ✅ user.name -> user.id
            const currentUser = app.state.user.id; 
            await app.api.deleteUser(currentUser); 
            localStorage.removeItem('user'); 
            app.state.user = null; 
            app.utils.showNotification('계정이 삭제되었습니다. 이용해주셔서 감사합니다.', 'success'); 
            setTimeout(() => { window.location.href = 'mainview.html'; }, 2000); 
        }
    }
    
    initializeSettingsPage(); 
});