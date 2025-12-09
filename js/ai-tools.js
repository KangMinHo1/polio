/**
 * ai-tools.js
 * AI 도구 페이지의 동적 기능을 담당합니다. (챗봇, 면접 질문 생성, 채용 공고 추천)
 */
document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;

    if (!currentUser) {
        app.utils.showNotification('AI 도구를 이용하려면 로그인이 필요합니다.', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const elements = {
        aiForm: document.getElementById('ai-form'),
        functionList: document.getElementById('ai-function-list'),
        responseArea: document.getElementById('ai-response-area'),
        aiInput: document.getElementById('ai-input'),
    };

    const placeholders = {
        chatbot: "메시지를 입력하세요...",
        interview: "예: Spring Boot, JPA, React를 사용한 쇼핑몰 프로젝트 경험이 있습니다. 백엔드 개발자 직무에 지원합니다.",
        jobs: "예: 자바, Spring Boot, 3년차 백엔드 개발자, 금융권 희망",
    };

    function setupEventListeners() {
        // AI 기능 선택 시
        elements.functionList.addEventListener('click', (e) => {
            if (e.target.matches('.ai-function-item')) {
                const selectedFunction = e.target.dataset.function;

                // 활성 클래스 업데이트
                elements.functionList.querySelectorAll('.ai-function-item').forEach(item => item.classList.remove('active'));
                e.target.classList.add('active');

                // 입력창 플레이스홀더 변경
                elements.aiInput.placeholder = placeholders[selectedFunction] || "메시지를 입력하세요...";

                // 대화 내용 초기화
                elements.responseArea.innerHTML = `
                    <div class="message-bubble ai">
                        안녕하세요! [${e.target.textContent.trim()}] 기능이 선택되었습니다. 무엇을 도와드릴까요?
                    </div>`;
            }
        });

        // 폼 제출 이벤트
        elements.aiForm.addEventListener('submit', handleFormSubmit);
    }

    // 메시지 버블을 화면에 추가하는 함수
    function appendMessage(container, text, sender = 'ai') {
        // 첫 번째 메시지가 기본 안내 메시지일 경우, 화면을 클리어
        if (container.children.length === 1 && container.querySelector('.message-bubble.ai')) {
            const initialMessage = "안녕하세요! 왼쪽에서 원하는 AI 기능을 선택하고 무엇이든 물어보세요.";
            if (container.firstElementChild.textContent.trim().startsWith(initialMessage)) {
                container.innerHTML = '';
            }
        }

        const messageBubble = document.createElement('div');
        messageBubble.className = `message-bubble ${sender}`;
        // 응답 텍스트의 줄바꿈을 <br> 태그로 변환하여 표시
        messageBubble.innerHTML = text.replace(/\n/g, '<br>');
        container.appendChild(messageBubble);
        container.scrollTop = container.scrollHeight; // 항상 최신 메시지가 보이도록 스크롤
    }

    // 로딩 인디케이터를 표시하는 함수
    function showLoading(container) {
        const loadingBubble = document.createElement('div');
        loadingBubble.className = 'message-bubble ai loading';
        loadingBubble.innerHTML = '<span>.</span><span>.</span><span>.</span>';
        loadingBubble.id = 'loading-indicator';
        container.appendChild(loadingBubble);
        container.scrollTop = container.scrollHeight;
    }

    // 로딩 인디케이터를 제거하는 함수
    function hideLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    // 통합 폼 제출 처리
    async function handleFormSubmit(e) {
        e.preventDefault();
        const query = elements.aiInput.value.trim();
        if (!query) return;

        const selectedFunction = elements.functionList.querySelector('.ai-function-item.active').dataset.function;

        // 사용자 메시지 표시
        appendMessage(elements.responseArea, query, 'user');
        elements.aiInput.value = '';

        // 로딩 인디케이터 표시
        showLoading(elements.responseArea);

        if (selectedFunction === 'chatbot') {
            // 챗봇 기능: 텍스트 기반 API 호출
            try {
                const response = await fetch(`${app.api.BASE_URL}/api/bot/chat`, {
                    method: 'POST',
                    headers: {
                        ...app.api.getAuthHeaders(),
                        'Content-Type': 'text/plain' // 서버에서 String으로 받으므로 text/plain으로 설정
                    },
                    body: query // JSON.stringify 없이 문자열 그대로 전송
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const answer = await response.text(); // 응답을 텍스트로 받음
                hideLoading();
                appendMessage(elements.responseArea, answer, 'ai');

            } catch (error) {
                hideLoading();
                appendMessage(elements.responseArea, '죄송합니다. 챗봇 응답을 가져오는 데 실패했습니다.', 'ai error');
                console.error('Chatbot API error:', error);
            }
        } else {
            // 다른 기능들은 아직 개발 중이므로 가짜 응답 처리
            setTimeout(() => {
                hideLoading();
                const fakeResponse = `이것은 "${query}"에 대한 AI의 가상 응답입니다. [${selectedFunction}] 기능은 현재 개발 중입니다.`;
                appendMessage(elements.responseArea, fakeResponse, 'ai');
            }, 1000);
        }
    }

    // 페이지 초기화 함수 실행
    setupEventListeners();
});