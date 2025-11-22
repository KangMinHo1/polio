package hacktip.demo.service;

import hacktip.demo.domain.post.Category;
import hacktip.demo.dto.postDto.CategoryResponseDto;
import hacktip.demo.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public void createCategory(String categoryName) {
        // 이미 존재하는 카테고리인지 확인
        if (categoryRepository.findByCategoryName(categoryName).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 카테고리입니다.");
        } else {
            // 새로운 카테고리 생성
            Category newCategory = new Category(categoryName);
            categoryRepository.save(newCategory);
        }
    }

    public CategoryResponseDto findAllCategory(){
        List<Category> categorys = categoryRepository.findAll();

        return new CategoryResponseDto(categorys);
    }
}
