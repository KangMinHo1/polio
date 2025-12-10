package hacktip.demo.controller;


import hacktip.demo.dto.InterviewQuestionRequestDto;
import hacktip.demo.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController // 1. 이 클래스는 API 요청을 처리하는 컨트롤러임을 명시 (JSON 응답)
@RequestMapping("/api/bot") // 2. 이 컨트롤러의 기본 주소는 /api/bot 으로 시작
@RequiredArgsConstructor
public class GeminiController {

    private final GeminiService geminiService;

    // 챗봇 기능
    @PostMapping("/chat")
    public String chat(@RequestBody String message) {
        // 5. 프론트엔드에서 보낸 message(질문)를 받아서 서비스에 전달
        // 6. 서비스가 OpenAI에 다녀와서 가져온 답변을 그대로 반환
        return geminiService.chat(message);
    }

    // 면접 질문 생성 기능
    @PostMapping("/questions")
    public ResponseEntity<String> createInterviewQuestions(@RequestBody InterviewQuestionRequestDto requestDto) {
        String questions = geminiService.generateInterviewQuestions(requestDto);

        // 프론트엔드에서 줄바꿈(\n)을 처리하여 보여주면 됩니다.
        return ResponseEntity.ok(questions);
    }
}
