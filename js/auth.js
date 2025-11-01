/**
 * auth.js
 */
document.addEventListener('DOMContentLoaded', async () => {
  await window.APP_INITIALIZATION;
  const app = window.CommunityApp;

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('email').value; // HTML의 id가 'email'이지만 '아이디'로 사용됨
      const password = document.getElementById('password').value;
      
      const submitButton = e.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = '로그인 중...';

      try {
        const user = await app.api.loginUser(id, password);
        app.state.user = user;
        localStorage.setItem('user', JSON.stringify(user));
        // ✅ (카테고리) 아이디님, 환영합니다!
        app.utils.showNotification(`(${user.category}) ${user.id}님, 환영합니다!`, 'success');
        setTimeout(() => { window.location.href = 'mainview.html'; }, 1000);
      } catch (error) {
        app.utils.showNotification(error.message, 'danger');
        submitButton.disabled = false;
        submitButton.textContent = '로그인';
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('signupId').value;
      let category = document.getElementById('signupCategory').value;

      // ✅ admin 아이디일 경우 카테고리 '관리자'로 강제 설정
      if (id.toLowerCase() === 'admin') {
        category = '관리자';
      }

      const userData = {
        name: document.getElementById('signupName').value,
        category: category,
        email: document.getElementById('signupEmail').value,
        id: id,
        password: document.getElementById('signupPassword').value,
      };

      // ✅ 유효성 검사 필드 변경
      if (!userData.name || !userData.category || !userData.email || !userData.id || !userData.password) {
        return app.utils.showNotification('모든 항목을 입력해주세요.', 'warning');
      }

      const submitButton = e.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = '회원가입 중...';

      try {
        await app.api.signupUser(userData);
        app.utils.showNotification('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
      } catch (error) {
        app.utils.showNotification(error.message, 'danger');
        submitButton.disabled = false;
        submitButton.textContent = '회원가입';
      }
    });
  }
});