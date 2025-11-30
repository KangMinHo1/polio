package hacktip.demo.controller;

import hacktip.demo.dto.chatDto.ChatMessageRequestDto;
import hacktip.demo.dto.chatDto.ChatMessageResponseDto;
import hacktip.demo.security.UserDetailsImpl;
import hacktip.demo.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/send")
    // [수정] @AuthenticationPrincipal 대신 Principal(또는 Authentication) 객체를 직접 받습니다.
    public void sendMessage(ChatMessageRequestDto requestDto, Principal principal) {

        // 1. Principal이 null인지 확인 (인증 자체가 안 된 경우)
        if (principal == null) {
            log.error("sendMessage Error: Principal object is NULL. (Not Authenticated)");
            return;
        }

        // 2. Principal을 Authentication으로 형변환 후 UserDetailsImpl 꺼내기
        UsernamePasswordAuthenticationToken authentication = (UsernamePasswordAuthenticationToken) principal;
        Object principalObject = authentication.getPrincipal();

        Long memberId = null;

        // 3. 타입 확인 후 ID 추출 (가장 안전한 방법)
        if (principalObject instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) principalObject;
            memberId = userDetails.getMemberId();
            log.info("ChatController - Extracted MemberId: {}", memberId);
        } else {
            // 만약 UserDetailsImpl이 아니라면, 여기서 문제 원인을 알 수 있음
            log.error("ChatController Error: Principal is not UserDetailsImpl. It is: {}", principalObject.getClass().getName());
        }

        // 4. roomId가 null인지도 확인
        if (requestDto.getRoomId() == null) {
            log.error("ChatController Error: Room ID is NULL within the request DTO.");
        }

        // 5. Service 호출
        // memberId가 null이면 여기서 또 에러가 나겠지만, 위의 로그로 원인을 확실히 알 수 있음
        ChatMessageResponseDto responseDto = chatService.saveMessage(requestDto, memberId);

        messagingTemplate.convertAndSend("/topic/room/" + responseDto.getRoomId(), responseDto);
    }
}