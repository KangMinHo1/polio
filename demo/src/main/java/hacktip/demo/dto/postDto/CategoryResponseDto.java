package hacktip.demo.dto.postDto;

import hacktip.demo.domain.post.Category;
import lombok.Getter;

import java.util.List;

@Getter
public class CategoryResponseDto {

    List<String> categorys;

    public CategoryResponseDto(List<Category> categoryList){
        this.categorys = categoryList.stream()
                .map(category -> category.getCategoryName())
                .toList();
    }
}
