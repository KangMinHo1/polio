package hacktip.demo.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class InterviewQuestionRequestDto {
    private String jobRole;      // 희망 직무 (예: 백엔드 개발자)
    private String careerLevel;  // 경력 (예: 신입, 3년차, 시니어)
    private String techStack;    // 주 기술 스택 (예: Java, Spring Boot, JPA)
    private Integer questionCount; // 질문 개수 (기본값 설정 예정)
}
