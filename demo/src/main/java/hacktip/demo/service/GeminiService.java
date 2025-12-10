package hacktip.demo.service;

import hacktip.demo.dto.InterviewQuestionRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service // 1. 이 클래스는 서비스 로직을 담당하는 스프링 빈임을 명시
@RequiredArgsConstructor // 2. final이 붙은 필드에 대해 생성자를 자동으로 만들어줌 (의존성 주입)
public class GeminiService {

    private final RestTemplate restTemplate;

    // 3. application.properties에 있는 값들을 가져와 변수에 넣습니다.
    @Value("${gemini.api.key}")
    private String apiKey;


    public String chat(String prompt) {

        // 키가 제대로 로드되었는지, 중복은 없는지 눈으로 확인
        System.out.println("현재 로드된 API Key: [" + apiKey + "]");

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
        // 2. 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 3. 바디 설정 (구글 Gemini가 원하는 모양)
        // {
        //   "contents": [
        //     {
        //       "parts": [{"text": "안녕하세요"}]
        //     }
        //   ]
        // }
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(part);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", parts);

        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(content);

        Map<String, Object> body = new HashMap<>();
        body.put("contents", contents);

        // 4. 요청 보내기
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        // 5. 응답 파싱 (구조: candidates -> content -> parts -> text)
        try {
            Map<String, Object> responseBody = response.getBody();
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> resParts = (List<Map<String, Object>>) contentMap.get("parts");
            return (String) resParts.get(0).get("text");
        } catch (Exception e) {
            return "Gemini 응답 파싱 에러";
        }
    }

    /**
     * 면접 질문 생성 전용 메서드
     */
    public String generateInterviewQuestions(InterviewQuestionRequestDto requestDto) {
        // 1. 프롬프트 엔지니어링 (페르소나 부여 및 구체적 지시)
        String prompt = createInterviewPrompt(requestDto);

        // 2. Gemini 호출 (기존 chat 메서드 재사용하거나 로직 통합)
        return callGeminiApi(prompt);
    }

    private String createInterviewPrompt(InterviewQuestionRequestDto dto) {
        int count = (dto.getQuestionCount() != null) ? dto.getQuestionCount() : 5;

        // 프롬프트 템플릿
        return String.format(
                "당신은 %s 분야의 10년 차 베테랑 면접관입니다.\n" +
                        "지원자의 정보는 다음과 같습니다.\n" +
                        "- 희망 직무: %s\n" +
                        "- 경력 수준: %s\n" +
                        "- 기술 스택: %s\n\n" +
                        "지원자의 수준에 맞는 기술 면접 질문 %d가지를 생성해주세요.\n" +
                        "질문은 너무 기초적인 것보다는 실무에서 겪을 수 있는 문제 해결 능력이나 깊이 있는 원리를 묻는 질문 위주로 구성해주세요.\n" +
                        "결과는 번호를 매겨서 질문 내용만 깔끔하게 출력해주세요.",
                dto.getJobRole(),
                dto.getJobRole(),
                dto.getCareerLevel(),
                dto.getTechStack(),
                count
        );
    }

    // 기존 chat 로직을 내부 호출용으로 분리 (Unchecked 경고 억제 적용)
    @SuppressWarnings("unchecked")
    private String callGeminiApi(String prompt) {
        // (주의: 모델 버전 확인 필요. gemini-1.5-flash가 현재 표준입니다.)
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Request Body 생성
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(part);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", parts);

        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(content);

        Map<String, Object> body = new HashMap<>();
        body.put("contents", contents);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            // Response Parsing
            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) return "응답이 비어있습니다.";

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) return "후보군이 없습니다.";

            Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> resParts = (List<Map<String, Object>>) contentMap.get("parts");

            return (String) resParts.get(0).get("text");

        } catch (Exception e) {
            e.printStackTrace();
            return "Gemini API 호출 중 오류 발생: " + e.getMessage();
        }
    }
}
