/**
 * chat.js
 * 채팅방 페이지의 동적 기능을 담당합니다.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;

    // 1. 로그인 확인
    if (!currentUser) {
        app.utils.showNotification('채팅을 이용하려면 로그인이 필요합니다.', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const elements = {
        messagesContainer: document.getElementById('chat-messages'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input')
    };

    let chatMessages = []; // 채팅 메시지 저장 배열

    // 2. 메시지 불러오기 및 렌더링
    async function loadMessages() {
        chatMessages = await app.api.fetchChatMessages();
        elements.messagesContainer.innerHTML = ''; // 기존 메시지 클리어

        chatMessages.forEach(msg => {
            renderMessage(msg);
        });
        
        // 스크롤을 맨 아래로 (단, URL로 특정 메시지를 찾아가는 경우는 제외)
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('messageId')) {
            scrollToBottom();
        }
    }

    // 3. 새 메시지 렌더링
    function renderMessage(msg) {
        const msgElement = document.createElement('div');
        const isMyMessage = msg.authorId === currentUser.id;
        
        // ✅ [수정] 메시지 요소에 messageId로 'id'를 추가합니다.
        msgElement.id = msg.messageId; 
        msgElement.className = `chat-message ${isMyMessage ? 'my-message' : 'other-message'}`;
        
        const authorDisplay = `(${(msg.authorCategory || '사용자')}) ${msg.authorId}`;
        
        msgElement.innerHTML = `
            <div class="message-meta">${authorDisplay} • ${app.utils.formatDate(msg.createdAt)}</div>
            <div class="message-content">${msg.content}</div>
        `;
        
        elements.messagesContainer.appendChild(msgElement);
    }

    // 4. 스크롤 맨 아래로
    function scrollToBottom() {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }

    // 5. 메시지 전송 핸들러
    async function handleChatSubmit(e) {
        e.preventDefault();
        const content = elements.chatInput.value.trim();
        
        if (!content) return;

        const messageData = {
            content: content,
            authorId: currentUser.id,
            authorCategory: currentUser.category,
            createdAt: Date.now()
        };

        // ✅ [수정] API가 messageId가 포함된 새 메시지 객체를 반환하도록 합니다.
        const newMessage = await app.api.sendChatMessage(messageData);

        // ✅ [수정] 알림 링크에 새 messageId를 포함시킵니다.
        const link = `chat.html?messageId=${newMessage.messageId}`;
        await app.utils.parseMentionsAndCreateNotifications(content, link, currentUser);

        renderMessage(newMessage); // 내 화면에 즉시 렌더링
        scrollToBottom();
        elements.chatInput.value = ''; // 입력창 비우기
    }

    // 6. 1:1 채팅 시도 (URL 파라미터 확인)
    function checkDirectMessage() {
        const urlParams = new URLSearchParams(window.location.search);
        const targetUser = urlParams.get('user');
        
        if (targetUser && targetUser !== currentUser.id) {
            elements.chatInput.value = `@${targetUser} `;
            elements.chatInput.focus();
        }
    }
    
    // ✅ [추가] 7. URL에서 messageId를 확인하여 스크롤 및 하이라이트
    function scrollToMessageFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const messageId = urlParams.get('messageId');

        if (messageId) {
            const targetMessage = document.getElementById(messageId);
            if (targetMessage) {
                // 스크롤
                targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // 하이라이트
                targetMessage.classList.add('highlighted-message');
                // 2초 후에 하이라이트 제거
                setTimeout(() => {
                    targetMessage.classList.remove('highlighted-message');
                }, 2000);
            }
        }
    }


    // --- 초기화 실행 ---
    elements.chatForm.addEventListener('submit', handleChatSubmit);
    await loadMessages(); // 1. 메시지를 먼저 로드하고
    checkDirectMessage(); // 2. @ 멘션 채우기
    scrollToMessageFromUrl(); // 3. URL에 messageId가 있다면 스크롤

    // (시뮬레이션) 5초마다 다른 사용자의 메시지를 받아오는 것처럼 localStorage를 다시 로드
    setInterval(async () => {
        const latestMessages = await app.api.fetchChatMessages();
        if (latestMessages.length > chatMessages.length) {
            const newMessages = latestMessages.slice(chatMessages.length);
            newMessages.forEach(msg => {
                if (msg.authorId !== currentUser.id) { // 내가 쓴 메시지는 제외
                    renderMessage(msg);
                    scrollToBottom();
                }
            });
            chatMessages = latestMessages;
        }
    }, 5000);
});