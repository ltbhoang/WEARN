from api.serializers.collection_serializers import CollectionDetailSerializer
from rest_framework import generics, permissions, viewsets, status # type: ignore
from rest_framework.response import Response # type: ignore
from django.contrib.auth.models import User
from .models import Collection, UserProfile, Vocabulary, LearningProgress, SavedVocabulary
from .serializers import (
    CollectionSerializer, RegisterSerializer, 
    VocabularySerializer, LearningProgressSerializer, StreakSerializer
)

# 1. Vocabulary: Từ điển chung, chỉ đọc
class VocabularyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Vocabulary.objects.all() # Bắt buộc phải có dòng này
    serializer_class = VocabularySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        class_name = self.request.query_params.get('class_name')
        if class_name:
            return Vocabulary.objects.filter(class_name=class_name)
        return self.queryset

# 2. Collection: Của ai người đó thấy
class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all() # Thêm dòng này để hết lỗi AssertionError
    serializer_class = CollectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Lọc lại: Chỉ trả về đồ của User đang đăng nhập
        return Collection.objects.filter(user=self.request.user).order_by('-date_key')

    def perform_create(self, serializer):
        # Tự động gán user khi tạo mới qua API
        serializer.save(user=self.request.user)
        
    def get_serializer_class(self):
        # Nếu đang xem chi tiết (ví dụ: /api/collections/1/)
        if self.action == 'retrieve':
            return CollectionDetailSerializer
        # Nếu đang xem danh sách (/api/collections/)
        return CollectionSerializer

# 3. Tiến độ học tập: Riêng tư
class LearningProgressViewSet(viewsets.ModelViewSet):
    queryset = LearningProgress.objects.all() # Thêm dòng này luôn má ơi
    serializer_class = LearningProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LearningProgress.objects.filter(user=self.request.user)

# 4. View đăng ký
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class StreakView(generics.RetrieveAPIView):
    serializer_class = StreakSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Trả về profile của chính user đang đăng nhập
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile