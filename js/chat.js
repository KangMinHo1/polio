document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;

    if (!currentUser) {
        app.utils.showNotification('채팅을 이용하려면 로그인이 필요합니다.', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const elements = {
        roomList: document.getElementById('chat-room-list'),
        mainContainer: document.getElementById('chat-main-container'),
        welcomeScreen: document.getElementById('chat-welcome-screen'),
        chatRoomContent: document.getElementById('chat-room-content'),
        messagesContainer: document.getElementById('chat-messages'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input')
    };

    let currentRoomId = null;
    let stompClient = null;

    async function initializeChatPage() {
        await renderRoomList();

        const urlParams = new URLSearchParams(window.location.search);
        const roomIdFromUrl = urlParams.get('roomId');

        if (roomIdFromUrl) {
            await loadChatRoom(Number(roomIdFromUrl));
        }
    }

    async function renderRoomList() {
        try {
            const rooms = await app.api.fetchMyChatRooms();
            if (rooms.length === 0) {
                elements.roomList.innerHTML = '<li>참여 중인 채팅방이 없습니다.</li>';
                return;
            }
            elements.roomList.innerHTML = rooms.map(room => `
                <li class="chat-room-item" data-room-id="${room.roomId}">
                    <div class="room-name">${room.roomName}</div>
                </li>
            `).join('');

            elements.roomList.querySelectorAll('.chat-room-item').forEach(item => {
                item.addEventListener('click', () => {
                    const roomId = Number(item.dataset.roomId);
                    loadChatRoom(roomId);
                });
            });

        } catch (error) {
            console.error('Failed to fetch chat rooms:', error);
            elements.roomList.innerHTML = '<li>채팅방 목록을 불러오는 데 실패했습니다.</li>';
        }
    }

    async function loadChatRoom(roomId) {
        if (currentRoomId === roomId) return;

        currentRoomId = roomId;

        // UI 업데이트
        elements.welcomeScreen.style.display = 'none';
        elements.chatRoomContent.style.display = 'flex';
        elements.messagesContainer.innerHTML = '<li>메시지를 불러오는 중...</li>';

        document.querySelectorAll('.chat-room-item').forEach(item => {
            item.classList.toggle('active', Number(item.dataset.roomId) === roomId);
        });

        history.pushState({}, '', `chat.html?roomId=${roomId}`);

        connectAndSubscribe(roomId);

        try {
            const messages = await app.api.request(`/chat/room/${roomId}/messages`);
            elements.messagesContainer.innerHTML = '';
            messages.forEach(renderMessage);
            scrollToBottom();
        } catch (error) {
            console.error(`Failed to load messages for room ${roomId}:`, error);
            elements.messagesContainer.innerHTML = `<li>${error.message || '메시지를 불러오는 데 실패했습니다.'}</li>`;
        }
    }

    function renderMessage(msg) {
        const msgElement = document.createElement('li');
        const isMyMessage = msg.senderName === currentUser.name;

        msgElement.className = `chat-message ${isMyMessage ? 'my-message' : 'other-message'}`;
        
        msgElement.innerHTML = `
            <div class="message-meta">${msg.senderName} • ${app.utils.formatDate(msg.sendDate)}</div>
            <div class="message-content">${msg.content}</div>
        `;
        
        elements.messagesContainer.appendChild(msgElement);
    }

    function scrollToBottom() {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }

    async function handleChatSubmit(e) {
        e.preventDefault();
        const content = elements.chatInput.value.trim();
        
        if (!content || !currentRoomId) return;

        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: '/app/chat/send',
                body: JSON.stringify({
                    roomId: currentRoomId,
                    content: content
                })
            });
            elements.chatInput.value = '';
        } else {
            app.utils.showNotification('채팅 서버에 연결되지 않았습니다.', 'danger');
        }
    }

    function connectAndSubscribe(roomId) {
        if (stompClient && stompClient.connected) {
            stompClient.unsubscribe(`/topic/room/${currentRoomId}`);
            subscribeToRoom(roomId);
        } else {
            stompClient = new StompJs.Client({
                brokerURL: 'ws://localhost:8080/ws-stomp',
                connectHeaders: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                },
                onConnect: () => {
                    console.log('WebSocket에 연결되었습니다.');
                    subscribeToRoom(roomId);
                },
                onStompError: (frame) => {
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                    app.utils.showNotification('채팅 서버 연결에 실패했습니다.', 'danger');
                },
                onWebSocketError: (event) => {
                    console.error('WebSocket error:', event);
                }
            });
            stompClient.activate();
        }
    }

    function subscribeToRoom(roomId) {
        if (stompClient && stompClient.connected) {
            stompClient.subscribe(`/topic/room/${roomId}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                if (receivedMessage.roomId === currentRoomId) {
                    renderMessage(receivedMessage);
                    scrollToBottom();
                }
            });
            console.log(`${roomId}번 방을 구독했습니다.`);
        }
    }

    elements.chatForm.addEventListener('submit', handleChatSubmit);
    initializeChatPage();

    window.addEventListener('beforeunload', () => {
        if (stompClient && stompClient.connected) {
            stompClient.deactivate();
        }
    });
});