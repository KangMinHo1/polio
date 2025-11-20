package hacktip.demo.security;

import hacktip.demo.domain.Member;
import hacktip.demo.domain.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@RequiredArgsConstructor
public class UserDetailsImpl implements UserDetails {

    private final Member member;

    // Member 엔티티를 직접 반환하는 getter
    public Member getMember() {
        return member;
    }

    // 컨트롤러 등에서 Member의 PK가 필요할 때 사용
    public Long getMemberId() {
        return member.getMemberId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 현재는 권한(Role)을 사용하지 않으므로 빈 리스트를 반환합니다.
        Role role = member.getRole();

        // Role Enum의 key (예: "ROLE_MENTOR")를 사용하여 권한 객체 생성
        // SimpleGrantedAuthority는 스프링 시큐리티가 이해하는 권한 표현 방식입니다.
        return Collections.singletonList(new SimpleGrantedAuthority(role.getKey()));
    }

    @Override
    public String getPassword() {
        return member.getPassword();
    }

    @Override
    public String getUsername() {
        // Spring Security에서 username은 고유 식별자를 의미합니다. 여기서는 email을 사용합니다.
        return member.getEmail();
    }

    // 계정이 만료되지 않았는지, 잠기지 않았는지 등을 설정합니다.
    // 지금은 모두 true로 설정하여 항상 활성화 상태로 둡니다.
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}