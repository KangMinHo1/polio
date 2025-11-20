package hacktip.demo.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.stream.Stream;

@RequiredArgsConstructor
@Getter
public enum Role {
    JOB_SEEKER("ROLE_JOB_SEEKER", "취준생"),
    INCUMBENT("ROLE_INCUMBENT", "재직자"),
    MENTOR("ROLE_MENTOR", "멘토"),
    ADMIN("ROLE_ADMIN", "관리자");

    private final String key;
    private final String title;

    // 2. [요청 처리] 프론트엔드 -> 서버 (JSON parsing)
    // 클라이언트가 "취준생"이라고 보내면, 자동으로 JOB_SEEKER Enum으로 변환해줌
    @JsonCreator
    public static Role parsing(String inputValue) {
        return Stream.of(Role.values())
                // "취준생"과 title이 같거나, "JOB_SEEKER"와 이름이 같은지 확인
                .filter(role -> role.title.equals(inputValue) || role.name().equals(inputValue))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 역할입니다: " + inputValue));
    }

    // 3. [응답 처리] 서버 -> 프론트엔드 (JSON response)
    // 서버가 클라이언트에게 Role을 줄 때 "취준생"으로 줄지, "JOB_SEEKER"로 줄지 결정
    // @JsonValue가 붙은 필드의 값이 나갑니다.
    // (만약 "JOB_SEEKER"로 주고 싶으면 이 어노테이션을 title에서 빼면 됩니다.)
    @JsonValue
    public String getTitle() {
        return title;
    }
}
