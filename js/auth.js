/**
 * auth.js
 */
document.addEventListener('DOMContentLoaded', async () => {
  await window.APP_INITIALIZATION;
  const app = window.CommunityApp; //shared.js 객체

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      const submitButton = e.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = '로그인 중...';

      try {
        const user = await app.api.loginUser(email, password);
        // 이제 loginUser 함수가 state와 localStorage 업데이트를 모두 담당합니다.
        app.utils.showNotification(`(${user.role}) ${user.name}님, 환영합니다!`, 'success');
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

      // [수정] 변경된 form의 id에 맞게 값을 가져옵니다.
      const name = document.getElementById('name').value;
      const category = document.getElementById('role').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      // 백엔드 Role Enum과 매핑될 영문 값을 찾습니다.
      let roleValue;
      switch (category) {
        case '취준생':
          roleValue = 'JOB_SEEKER'; break;
        case '재직자':
          roleValue = 'INCUMBENT'; break;
        default:
          roleValue = null; // '선택' 또는 다른 값이면 null 처리
      }

      const userData = {
        name: name,
        role: roleValue, // 백엔드가 기대하는 영문 Enum 값으로 전송
        email: email,
        password: password
      };

      if (!userData.role) {
        return app.utils.showNotification('직군(재직자/취준생)을 선택해주세요.', 'warning');
      }
      if (!userData.name || !userData.email || !userData.password) {
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