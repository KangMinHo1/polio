package hacktip.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Service가 Controller에게 토큰 정보를 전달하기 위한 DTO
 * (Access Token, Refresh Token, RT 만료 시간(ms))
 */
@Getter
@AllArgsConstructor
public class TokenInfo {

    private String accessToken;
    private String refreshToken;
    private Long refreshTokenExpirationMs;

}
