/**
 * auth.js
 */
document.addEventListener('DOMContentLoaded', async () => { //함수 실행을 사용자 선택에 맡김 DOMContentLoaded 이벤트는 현재 HTML 문서 구조가 모두 준비되었을때 함수를 실행
  await window.APP_INITIALIZATION; //layout.js 함수 login.html에서는 layout.js 사용 X -> Promise객체의 상태를 undefined로 처리후 다음줄 처리
  const app = window.CommunityApp; //shared.js 객체

  //준비된 html이 login.html 일때 document.getElementById('loginForm')값이 null이 아님 
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => { //이메일, 비밀번호 입력 후 로그인 버튼을 눌렀을떄 이벤트 발생
      e.preventDefault(); //브라우저가 원래 하려고 했던 기본 동작을 막는매서드 => submit 기본 동작은 페이지를 새로고침 하면서 데이터 보내는 것을 막음으로서 => 비동기 로그인 처리
      //사용자의 로그인 입력 데이터 변수로 받기
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // 로그인 버튼 element를 가져오고 여러번 제출이 불가능하게 로그인 버튼 기능 막기
      const submitButton = e.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = '로그인 중...';

      try {
        const user = await app.api.loginUser(email, password); //서버에 로그인 요청하기
        app.utils.showNotification(`(${user.role}) ${user.name}님, 환영합니다!`, 'success'); // 로그인 성공 알림 표시
        setTimeout(() => { window.location.href = 'mainview.html'; }, 1000); //1초 후 메인 화면 이동
      } catch (error) {
        app.utils.showNotification(error.message, 'danger');
        submitButton.disabled = false;
        submitButton.textContent = '로그인';
      }
    });
  }

  // 준비된 html이 signup.html 일때
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault(); //submit의 기본 동작 새로고침 막기

      // form의 id에 맞게 값을 가져옵니다.
      const name = document.getElementById('name').value;
      const role = document.getElementById('role').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      // 백엔드 Role Enum과 매핑될 영문 값을 찾습니다.
      let roleValue;
      switch (role) {
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

      //유효성 검사
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
        await app.api.signupUser(userData); //회원가입 정보를 담은 리스트를 인수로 서버에 회원가입 요청
        app.utils.showNotification('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1000); //1초 후 로그인 화면 이동
      } catch (error) {
        app.utils.showNotification(error.message, 'danger');
        submitButton.disabled = false;
        submitButton.textContent = '회원가입';
      }
    });
  }
});