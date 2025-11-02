package hacktip.demo.repository;

import hacktip.demo.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// 1. JpaRepository를 상속받습니다.
//    <엔티티, ID의 타입> -> <RefreshToken, String>
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {

    // 2. 실제 토큰 값(value)으로 엔티티를 찾는 메서드
    //    (나중에 /reissue API에서 쿠키로 받은 토큰이 DB에 있는 유효한 토큰인지 검증할 때 필요)
    Optional<RefreshToken> findByTokenValue(String tokenValue);

}
