package hacktip.demo.security;

import hacktip.demo.domain.Member;
import hacktip.demo.domain.Role;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serializable;
import java.util.Collection;
import java.util.Collections;

@Getter
@Setter // [중요 1] Spring이 역직렬화할 때 값을 채워넣기 위해 필요할 수 있음
@NoArgsConstructor // [중요 2] 빈 객체 생성자
@AllArgsConstructor // 모든 필드 생성자
@ToString // 디버깅용
public class UserDetailsImpl implements UserDetails, Serializable { // [중요 3] 직렬화 기능 추가

    private static final long serialVersionUID = 1L; // 직렬화 버전 ID

    private Long memberId;
    private String email;
    private String password;
    private Role role;
    private String name;

    // Member 엔티티를 받아서 DTO처럼 값을 옮겨 담는 생성자
    public UserDetailsImpl(Member member) {
        this.memberId = member.getMemberId();
        this.email = member.getEmail();
        this.password = member.getPassword();
        this.role = member.getRole();
        this.name = member.getName();
    }

    // 컨트롤러에서 호출할 메서드
    public Long getMemberId() {
        return this.memberId;
    }

    // --- UserDetails 인터페이스 구현 ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Role이 null일 경우 방어 로직 추가
        if (role == null) {
            return Collections.emptyList();
        }
        return Collections.singletonList(new SimpleGrantedAuthority(role.getKey()));
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}