package hacktip.demo.controller;

import hacktip.demo.dto.chatDto.ChatMessageRequestDto;
import hacktip.demo.dto.chatDto.ChatMessageResponseDto;
import hacktip.demo.security.UserDetailsImpl;
import hacktip.demo.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate; // 1. 메시지 브로드캐스팅을 위한 템플릿

    /**
     * STOMP 메시지 처리 메서드
     * (Client -> Server)
     *
     * @MessageMapping("/chat/send")
     * - 클라이언트가 "/app/chat/send" 주소로 메시지를 보내면 이 메서드가 호출됩니다.
     */
    @MessageMapping("/chat/send")
    // 2. (수정) @AuthenticationPrincipal String email 파라미터 추가
    public void sendMessage(ChatMessageRequestDto requestDto, @AuthenticationPrincipal UserDetailsImpl userDetails){
        String email = userDetails.getUsername(); // UserDetails에서 이메일 추출
        // 1. (DB 저장) DTO를 서비스로 넘겨 메시지를 DB에 저장하고, 응답 DTO를 받음  --> (수정) Service 호출 시, DTO와 함께 인증된 이메일 전달
        ChatMessageResponseDto responseDto = chatService.saveMessage(requestDto, email);

        // 2. (브로드캐스팅) 메시지를 해당 채팅방의 구독자들에게 전송
        //    - "/topic/room/{roomId}" 주소를 구독(subscribe) 중인 클라이언트들에게
        //      responseDto (저장된 메시지 정보)를 전송합니다.
        messagingTemplate.convertAndSend("/topic/room/" + responseDto.getRoomId(), responseDto);
    }
}
