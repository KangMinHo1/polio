/**
 * find-account.js
 */
document.addEventListener('DOMContentLoaded', async () => {
  await window.APP_INITIALIZATION;
  const app = window.CommunityApp;

  // --- 아이디 찾기 기능 ---
  const findIdForm = document.getElementById('findIdForm');
  if (findIdForm) {
    findIdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      // ✅ '학번' -> '이름'
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const users = await app.api.fetchAllUsers();
      // ✅ u.studentId -> u.name
      const foundUser = users.find(u => u.name === name && u.email === email);

      if (foundUser) {
        const message = `회원님의 아이디는 [ ${foundUser.id} ] 입니다.`;
        window.location.href = `show-result.html?title=아이디 찾기 결과&message=${encodeURIComponent(message)}`;
      } else {
        app.utils.showNotification('일치하는 사용자 정보가 없습니다.', 'warning');
      }
    });
  }

  // --- 비밀번호 찾기 기능 ---
  const findPasswordForm = document.getElementById('findPasswordForm');
  if (findPasswordForm) {
    findPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('id').value;
      // ✅ '학번' -> '이름', '이메일'
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const users = await app.api.fetchAllUsers();
      // ✅ u.studentId -> u.name && u.email
      const foundUser = users.find(u => u.id === id && u.name === name && u.email === email);

      if (foundUser) {
        // 보안상 비밀번호를 직접 보여주는 것은 좋지 않지만, 현재 구조를 유지합니다.
        const message = `회원님의 비밀번호는 [ ${foundUser.password} ] 입니다.`;
        window.location.href = `show-result.html?title=비밀번호 찾기 결과&message=${encodeURIComponent(message)}`;
      } else {
        app.utils.showNotification('일치하는 사용자 정보가 없습니다.', 'warning');
      }
    });
  }

  // --- 결과 표시 기능 ---
  const resultTitle = document.getElementById('result-title');
  const resultMessage = document.getElementById('result-message');
  if (resultTitle && resultMessage) {
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get('title');
    const message = urlParams.get('message');
    if (title) resultTitle.textContent = title;
    if (message) resultMessage.textContent = message;
  }
});