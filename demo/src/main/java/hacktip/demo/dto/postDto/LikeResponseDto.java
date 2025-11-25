package hacktip.demo.dto.postDto;

import lombok.Getter;

@Getter
public class LikeResponseDto {

    private int likes;

    public LikeResponseDto(int likes) {
        this.likes = likes;
    }
}
