package hacktip.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 게시글 생성(Create) 요청을 위한 DTO
 * (write.js의 'postData' 객체와 정확히 일치)
 */
@Data
public class PostRequestDto {

    // (author 정보는 JWT 토큰에서 추출하므로 DTO에 포함되지 않음)

    @NotBlank(message = "제목을 입력해주세요.")
    @Size(max = 1000, message = "제목은 1000자를 초과할 수 없습니다.")
    private String title;

    @NotBlank(message = "카테고리를 선택해주세요.")
    private String category;

    @NotBlank(message = "게시글 타입을 선택해주세요.") // 'feedback' or 'casestudy'
    private String postType;

    @Size(max = 1000, message = "포트폴리오 링크는 1000자를 초과할 수 없습니다.")
    private String portfolioLink; // 'casestudy'의 경우 null일 수 있음

    @NotBlank(message = "내용을 입력해주세요.")
    private String content; // 'feedback'의 경우 JSON string, 'casestudy'의 경우 텍스트
}