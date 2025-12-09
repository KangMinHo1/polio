package hacktip.demo.service;

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
}
