from django.urls import path, include
from rest_framework.routers import DefaultRouter # type: ignore
from .views import CollectionViewSet, StreakView, VocabularyViewSet, LearningProgressViewSet, RegisterView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView # type: ignore

router = DefaultRouter()
router.register(r'collections', CollectionViewSet)
router.register(r'vocabularies', VocabularyViewSet)
router.register(r'learning-progress', LearningProgressViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Đường dẫn đăng ký
    path('register/', RegisterView.as_view(), name='auth_register'),
    
    # Đường dẫn đăng nhập (Lấy mã token)
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Đường dẫn làm mới mã token (khi mã cũ hết hạn)
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('streak/', StreakView.as_view(), name='streak-detail'),
]