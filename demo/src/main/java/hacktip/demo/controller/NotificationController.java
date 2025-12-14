package hacktip.demo.controller;

import hacktip.demo.domain.Member;
import hacktip.demo.dto.NotificationResponseDto;
import hacktip.demo.repository.MemberRepository;
import hacktip.demo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final MemberRepository memberRepository;

    @GetMapping
    public List<NotificationResponseDto> getNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return List.of(); // 비로그인 시 빈 리스트
        }

        // UserDetails의 username(email)으로 Member 조회
        Member member = memberRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("회원 정보가 없습니다."));

        return notificationService.getMyNotifications(member);
    }

    // [신규] 알림 읽음 처리 API
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> readNotification(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) throws AccessDeniedException {
        Member member = memberRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("회원 정보가 없습니다."));

        notificationService.readNotification(id, member);

        return ResponseEntity.ok().build();
    }
}
