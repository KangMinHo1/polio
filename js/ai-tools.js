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
        aiInputArea: document.getElementById('ai-input-area'), // 입력 영역 컨테이너
    };

    const placeholders = {
        chatbot: "메시지를 입력하세요...",
        interview: "예: Spring Boot, JPA, React를 사용한 쇼핑몰 프로젝트 경험이 있습니다. 백엔드 개발자 직무에 지원합니다.",
    };

    // 면접 질문 생성기 전용 입력 폼 HTML
    const interviewFormHTML = `
        <div id="interview-inputs">
            <div class="form-group-inline">
                <input type="text" id="interview-job-role" class="form-input" placeholder="희망 직무 (예: 백엔드 개발자)">
                <select id="interview-career-level" class="form-input">
                    <option value="신입">신입</option>
                    <option value="주니어 (1~3년차)">주니어 (1~3년차)</option>
                    <option value="시니어 (5년차 이상)">시니어 (5년차 이상)</option>
                </select>
                <input type="number" id="interview-question-count" class="form-input" value="5" min="1" max="10">
            </div>
            <div class="form-group">
                <textarea id="interview-tech-stack" class="form-input" rows="3" placeholder="주요 기술 스택과 프로젝트 경험을 자유롭게 작성해주세요.\n예: Spring Boot, JPA, React를 사용한 쇼핑몰 프로젝트 경험이 있습니다."></textarea>
            </div>
        </div>
    `;

    // 기본 챗봇 입력 폼 HTML
    const chatbotFormHTML = `
        <textarea id="ai-input" class="form-input" rows="3" placeholder="메시지를 입력하세요..."></textarea>
    `;

    // 현재 선택된 기능을 추적하는 변수
    let currentFunction = 'chatbot';

    function setupEventListeners() {
        // AI 기능 선택 시
        elements.functionList.addEventListener('click', (e) => {
            if (e.target.matches('.ai-function-item')) {
                const selectedFunction = e.target.dataset.function;

                // 활성 클래스 업데이트
                elements.functionList.querySelectorAll('.ai-function-item').forEach(item => item.classList.remove('active'));
                e.target.classList.add('active');
                currentFunction = selectedFunction;

                // 기능에 따라 입력 폼 변경
                if (selectedFunction === 'interview') {
                    elements.aiInputArea.innerHTML = interviewFormHTML;
                } else {
                    elements.aiInputArea.innerHTML = chatbotFormHTML;
                }

                // 대화 내용 초기화
                elements.responseArea.innerHTML = `
                    <div class="message-bubble ai">
                        안녕하세요! <strong>[${e.target.textContent.trim()}]</strong> 기능이 선택되었습니다. 무엇을 도와드릴까요?
                    </div>`;
            }
        });

        // 폼 제출 이벤트
        elements.aiForm.addEventListener('submit', handleFormSubmit);
    }

    // 메시지 버블을 화면에 추가하는 함수
    function appendMessage(container, text, sender = 'ai') {
        if (!container) return;

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

    async function handleChatbotSubmit() {
        const inputEl = document.getElementById('ai-input');
        const query = inputEl.value.trim();
        if (!query) return;

        appendMessage(elements.responseArea, query, 'user');
        inputEl.value = '';
        showLoading(elements.responseArea);

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
    }

    async function handleInterviewSubmit() {
        const jobRole = document.getElementById('interview-job-role').value.trim();
        const techStack = document.getElementById('interview-tech-stack').value.trim();

        if (!jobRole || !techStack) {
            app.utils.showNotification('희망 직무와 기술 스택을 모두 입력해주세요.', 'warning');
            return;
        }

        const requestDto = {
            jobRole: jobRole,
            careerLevel: document.getElementById('interview-career-level').value,
            techStack: techStack,
            questionCount: parseInt(document.getElementById('interview-question-count').value, 10)
        };

        const userQueryText = `<strong>[면접 질문 생성 요청]</strong><br><strong>직무:</strong> ${requestDto.jobRole}<br><strong>경력:</strong> ${requestDto.careerLevel}<br><strong>기술/경험:</strong> ${requestDto.techStack}`;
        appendMessage(elements.responseArea, userQueryText, 'user');
        showLoading(elements.responseArea);

        try {
            const response = await fetch(`${app.api.BASE_URL}/api/bot/questions`, {
                method: 'POST',
                headers: app.api.getAuthHeaders(),
                body: JSON.stringify(requestDto)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const questions = await response.text();
            hideLoading();
            appendMessage(elements.responseArea, questions, 'ai');

        } catch (error) {
            hideLoading();
            appendMessage(elements.responseArea, '죄송합니다. 면접 질문을 생성하는 데 실패했습니다.', 'ai error');
            console.error('Interview question API error:', error);
        }
    }

    // 통합 폼 제출 처리
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        if (currentFunction === 'chatbot') {
            await handleChatbotSubmit();
        } else if (currentFunction === 'interview') {
            await handleInterviewSubmit();
        }
    }

    // 페이지 초기화 함수 실행
    setupEventListeners();
});