from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CollectionViewSet, StreakView, VocabularyViewSet, 
    LearningProgressViewSet, RegisterView, FlashcardSetViewSet,
    FlashcardSetItemViewSet, SavedVocabularyViewSet, 
    # --- Import các view mới cho Kana/Lesson ---
    LessonViewSet,
    kana_detail,
    user_kana_progress,
    complete_stroke,
    # --- Import các view cho Profile ---
    UpdateProfileView,
    ChangePasswordView,
    UploadAvatarView,
    UserProfileDetailView,
    UploadTempImageView,
    DeleteTempImageView,
    due_vocabularies,
    submit_review,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'collections', CollectionViewSet)
router.register(r'learning-progress', LearningProgressViewSet)
router.register(r'flashcard-sets', FlashcardSetViewSet, basename='flashcardset')
router.register(r'flashcard-items', FlashcardSetItemViewSet, basename='flashcarditem')
router.register(r'saved-vocabularies', SavedVocabularyViewSet, basename='savedvocabulary')
# --- Đăng ký LessonViewSet (ReadOnly) ---
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'vocabularies', VocabularyViewSet, basename='vocabulary')

urlpatterns = [
    path('', include(router.urls)),
    
    # Đường dẫn đăng ký
    path('register/', RegisterView.as_view(), name='auth_register'),
    
    # Đường dẫn đăng nhập (Lấy mã token)
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Đường dẫn làm mới mã token (khi mã cũ hết hạn)
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Đường dẫn streak
    path('streak/', StreakView.as_view(), name='streak-detail'),
    
    # --- Các API cho Kana và Lesson ---
    path('kana/<uuid:pk>/', kana_detail, name='kana-detail'),
    path('kana-progress/<uuid:kana_id>/', user_kana_progress, name='kana-progress'),
    path('complete-stroke/', complete_stroke, name='complete-stroke'),
    
    # --- Các API cho Profile ---
    path('profile/', UpdateProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('upload-avatar/', UploadAvatarView.as_view(), name='upload-avatar'),
    path('user-profile/', UserProfileDetailView.as_view(), name='user-profile'),
    
    path('upload-temp-image/', UploadTempImageView.as_view(), name='upload-temp-image'),
    path('delete-temp-image/', DeleteTempImageView.as_view(), name='delete-temp-image'),
    
    path('due-vocabularies/', due_vocabularies, name='due-vocabularies'),
    path('submit-review/', submit_review, name='submit-review'),

]

# (Giữ nguyên các comment hướng dẫn phía dưới nếu bạn muốn)
# Các URL pattern chi tiết cho FlashcardSet (đã được router xử lý):
# GET /api/flashcard-sets/ - Danh sách bộ flashcard
# POST /api/flashcard-sets/ - Tạo bộ mới
# GET /api/flashcard-sets/{id}/ - Chi tiết bộ
# PUT/PATCH /api/flashcard-sets/{id}/ - Cập nhật bộ
# DELETE /api/flashcard-sets/{id}/ - Xóa bộ
# POST /api/flashcard-sets/{id}/add_vocab/ - Thêm từ vào bộ
# POST /api/flashcard-sets/{id}/remove_vocab/ - Xóa từ khỏi bộ
# POST /api/flashcard-sets/{id}/reorder/ - Sắp xếp lại thứ tự
# GET /api/flashcard-sets/{id}/review/ - Lấy từ chưa nhớ để ôn tập

# Các URL pattern cho FlashcardSetItem:
# GET /api/flashcard-items/ - Danh sách tất cả item (của user)
# GET /api/flashcard-items/{id}/ - Chi tiết item
# PUT/PATCH /api/flashcard-items/{id}/ - Cập nhật item (memorized, order)
# DELETE /api/flashcard-items/{id}/ - Xóa item khỏi bộ
# POST /api/flashcard-items/bulk_update_memorized/ - Cập nhật hàng loạt