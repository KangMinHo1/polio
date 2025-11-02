package hacktip.demo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "REFRESH_TOKENS")

public class RefreshToken {

    // 2. 이메일을 Primary Key(@Id)로 사용 (Member의 email과 동일)
    //    -> 한 명의 유저는 하나의 리프레시 토큰만 가질 수 있음
    @Id
    @Column(name = "USER_EMAIL", nullable = false)
    private String email;

    // 3. 실제 Refresh Token 값
    @Column(name = "TOKEN_VALUE", nullable = false)
    private String tokenValue;

    /**
     * 객체 생성 시 사용할 생성자
     * @param email 사용자의 고유 이메일
     * @param tokenValue 발급된 리프레시 토큰 값
     */
    public RefreshToken(String email, String tokenValue){
        this.email = email;
        this.tokenValue = tokenValue;
    }

    /**
     * 리프레시 토큰 값을 갱신하기 위한 메서드
     * (로그인 시마다 새 리프레시 토큰으로 덮어쓰기 위해 사용)
     * @param newTokenValue 새로 발급된 리프레시 토큰 값
     */
    public void updateToken(String newTokenValue){
        this.tokenValue = newTokenValue;
    }
}
