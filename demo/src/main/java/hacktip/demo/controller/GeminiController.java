package hacktip.demo.controller;


import hacktip.demo.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController // 1. 이 클래스는 API 요청을 처리하는 컨트롤러임을 명시 (JSON 응답)
@RequestMapping("/api/bot") // 2. 이 컨트롤러의 기본 주소는 /api/bot 으로 시작
@RequiredArgsConstructor
public class GeminiController {

    private final GeminiService geminiService;

    // 4. POST 요청으로 /api/bot/chat 주소로 들어오면 이 메서드 실행
    @PostMapping("/chat")
    public String chat(@RequestBody String message) {
        // 5. 프론트엔드에서 보낸 message(질문)를 받아서 서비스에 전달
        // 6. 서비스가 OpenAI에 다녀와서 가져온 답변을 그대로 반환
        return geminiService.chat(message);
    }
}
