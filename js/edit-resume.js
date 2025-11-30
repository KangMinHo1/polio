/**
 * edit-resume.js
 * 멘토 이력서 작성/수정 페이지의 동적 기능을 담당합니다.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;
    
    // 멘토 기능이 제거되었으므로 페이지 접근을 막습니다.
    app.utils.showNotification('현재 지원하지 않는 기능입니다.', 'warning');
    setTimeout(() => { window.location.href = 'mainview.html'; }, 1500);
});