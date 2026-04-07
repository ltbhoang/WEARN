from django.db import models
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.models import User

import cairosvg
import numpy as np
from PIL import Image
from io import BytesIO
from skimage.metrics import structural_similarity as ssim

from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response

from api.serializers.collection_serializers import CollectionDetailSerializer
from .models import Collection, UserProfile, Vocabulary, LearningProgress, SavedVocabulary, FlashcardSet, FlashcardSetItem, Lesson, KanaCharacter, UserLessonProgress, UserKanaStrokeProgress
from .serializers import (
    CollectionSerializer, RegisterSerializer, 
    VocabularySerializer, LearningProgressSerializer, StreakSerializer,
    FlashcardSetSerializer, 
    CreateFlashcardSetSerializer,
    FlashcardSetItemSerializer,
    UpdateFlashcardSetItemSerializer,
    SavedVocabularySerializer,
    LessonSerializer,
    KanaStrokeSerializer,
    UserKanaProgressSerializer
)

# 1. Vocabulary: Từ điển chung, chỉ đọc
class VocabularyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Vocabulary.objects.all()
    serializer_class = VocabularySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        class_name = self.request.query_params.get('class_name')
        if class_name:
            return Vocabulary.objects.filter(class_name=class_name)
        return self.queryset

# 2. Collection: Của ai người đó thấy
class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Collection.objects.filter(user=self.request.user).order_by('-date_key')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CollectionDetailSerializer
        return CollectionSerializer

# 3. Tiến độ học tập: Riêng tư
class LearningProgressViewSet(viewsets.ModelViewSet):
    queryset = LearningProgress.objects.all()
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
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile
    
# 5. Flashcard Set: Riêng tư, có thể tạo/sửa/xóa
class FlashcardSetViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return FlashcardSet.objects.filter(user=self.request.user).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateFlashcardSetSerializer
        return FlashcardSetSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_vocab(self, request, pk=None):
        """Thêm từ vựng vào flashcard set"""
        flashcard_set = self.get_object()
        saved_vocab_id = request.data.get('saved_vocab_id')
        
        if not saved_vocab_id:
            return Response(
                {'error': 'saved_vocab_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            saved_vocab = SavedVocabulary.objects.get(
                id=saved_vocab_id,
                collection__user=request.user
            )
        except SavedVocabulary.DoesNotExist:
            return Response(
                {'error': 'Saved vocabulary not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if FlashcardSetItem.objects.filter(
            flashcard_set=flashcard_set, 
            saved_vocab=saved_vocab
        ).exists():
            return Response(
                {'error': 'This vocabulary already exists in the set'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        max_order = flashcard_set.items.aggregate(models.Max('order'))['order__max'] or -1
        
        item = FlashcardSetItem.objects.create(
            flashcard_set=flashcard_set,
            saved_vocab=saved_vocab,
            order=max_order + 1
        )
        
        serializer = FlashcardSetItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_vocab(self, request, pk=None):
        """Xóa từ vựng khỏi flashcard set"""
        flashcard_set = self.get_object()
        item_id = request.data.get('item_id')
        
        if not item_id:
            return Response(
                {'error': 'item_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            item = flashcard_set.items.get(id=item_id)
            item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except FlashcardSetItem.DoesNotExist:
            return Response(
                {'error': 'Item not found in this set'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reorder(self, request, pk=None):
        """Sắp xếp lại thứ tự các từ trong set"""
        flashcard_set = self.get_object()
        order_data = request.data.get('order', [])
        
        if not order_data:
            return Response(
                {'error': 'order list is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        for item_data in order_data:
            try:
                item = flashcard_set.items.get(id=item_data['id'])
                item.order = item_data['order']
                item.save()
            except (FlashcardSetItem.DoesNotExist, KeyError):
                continue
        
        return Response({'status': 'reordered successfully'})
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def review(self, request, pk=None):
        """Lấy danh sách từ chưa nhớ để ôn tập"""
        flashcard_set = self.get_object()
        items = flashcard_set.items.filter(memorized=False).order_by('order')
        serializer = FlashcardSetItemSerializer(items, many=True)
        return Response(serializer.data)

class FlashcardSetItemViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FlashcardSetItemSerializer
    
    def get_queryset(self):
        return FlashcardSetItem.objects.filter(
            flashcard_set__user=self.request.user
        )
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UpdateFlashcardSetItemSerializer
        return FlashcardSetItemSerializer
    
    def perform_update(self, serializer):
        serializer.save()
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def bulk_update_memorized(self, request):
        """Cập nhật trạng thái memorized cho nhiều item cùng lúc"""
        items_data = request.data.get('items', [])
        
        for item_data in items_data:
            try:
                item = FlashcardSetItem.objects.get(
                    id=item_data['id'],
                    flashcard_set__user=request.user
                )
                item.memorized = item_data.get('memorized', item.memorized)
                item.save()
            except FlashcardSetItem.DoesNotExist:
                continue
        
        return Response({'status': 'updated successfully'})
    
class SavedVocabularyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SavedVocabularySerializer

    def get_queryset(self):
        return SavedVocabulary.objects.filter(
            collection__user=self.request.user
        ).order_by('-saved_at')
        
# 6. Lesson ViewSet (chỉ đọc + action hoàn thành bài học)
class LessonViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Danh sách các bài học (Hiragana/Katakana). 
    Người dùng có thể xem và đánh dấu hoàn thành bài học.
    """
    queryset = Lesson.objects.all().order_by('order')
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_lesson(self, request, pk=None):
        """
        Đánh dấu bài học hiện tại là đã hoàn thành.
        """
        lesson = self.get_object()
        progress, created = UserLessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson
        )
        if not progress.completed:
            progress.completed = True
            progress.completed_at = timezone.now()
            progress.save()
            return Response({'status': 'completed'}, status=status.HTTP_200_OK)
        return Response({'status': 'already completed'}, status=status.HTTP_200_OK)


# 7. API lấy chi tiết một Kana (kèm strokes)
@api_view(['GET'])
def kana_detail(request, pk):
    """
    Trả về thông tin chi tiết của một ký tự Kana, bao gồm danh sách các nét vẽ (strokes).
    """
    if not request.user.is_authenticated:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        kana = KanaCharacter.objects.get(pk=pk)
    except ObjectDoesNotExist:
        return Response({'error': 'Kana not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = KanaStrokeSerializer(kana)
    return Response(serializer.data)


# 8. API lấy tiến độ vẽ nét của user cho một Kana cụ thể
@api_view(['GET'])
def user_kana_progress(request, kana_id):
    """
    Trả về danh sách các nét đã hoàn thành và trạng thái hoàn thành của ký tự Kana đó.
    """
    if not request.user.is_authenticated:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        progress = UserKanaStrokeProgress.objects.get(user=request.user, kana_id=kana_id)
        serializer = UserKanaProgressSerializer(progress)
        return Response(serializer.data)
    except ObjectDoesNotExist:
        # Nếu chưa có bản ghi, trả về mặc định
        return Response({'completed_strokes': [], 'completed': False})


# 9. API cập nhật tiến độ khi user hoàn thành một nét
@api_view(['POST'])
def complete_stroke(request):
    """
    Kiểm tra nét vẽ của user, nếu đúng thì cập nhật tiến độ.
    """
    if not request.user.is_authenticated:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    kana_id = request.data.get('kana_id')
    stroke_index = request.data.get('stroke_index')
    user_svg = request.data.get('user_svg')

    # Validate input
    if not kana_id or stroke_index is None:
        return Response(
            {'error': 'kana_id and stroke_index are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not user_svg:
        return Response(
            {'error': 'user_svg is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Kiểm tra stroke_index là số nguyên không âm
    try:
        stroke_index = int(stroke_index)
        if stroke_index < 0:
            raise ValueError
    except (TypeError, ValueError):
        return Response(
            {'error': 'stroke_index must be a non-negative integer'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        kana = KanaCharacter.objects.get(pk=kana_id)
    except ObjectDoesNotExist:
        return Response({'error': 'Kana not found'}, status=status.HTTP_404_NOT_FOUND)

    # Kiểm tra kana đã có strokes chưa
    if not kana.strokes or kana.total_strokes == 0:
        return Response(
            {'error': 'This Kana has no strokes data. Please run extract_strokes script first.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    if stroke_index >= len(kana.strokes):
        return Response(
            {'error': f'Invalid stroke index. Max index: {len(kana.strokes)-1}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    template_svg = kana.strokes[stroke_index]['svg']

    # Hàm chuyển SVG sang numpy array (grayscale) với cache nhẹ
    # (có thể dùng lru_cache nhưng đơn giản)
    def svg_to_array(svg_str):
        try:
            png_data = cairosvg.svg2png(bytestring=svg_str.encode('utf-8'))
            img = Image.open(BytesIO(png_data)).convert('L')
            img = img.resize((300, 300))
            return np.array(img)
        except Exception as e:
            raise ValueError(f"SVG conversion error: {e}")

    # So sánh
    try:
        user_arr = svg_to_array(user_svg)
        template_arr = svg_to_array(template_svg)
        score = ssim(user_arr, template_arr)
        correct = score >= 0.8
    except Exception as e:
        return Response({'error': f'Comparison failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    # Nếu sai, trả về kết quả
    if not correct:
        return Response({
            'success': False,
            'correct': False,
            'similarity': score
        }, status=status.HTTP_200_OK)

    # Nếu đúng, cập nhật tiến độ
    progress, created = UserKanaStrokeProgress.objects.get_or_create(
        user=request.user,
        kana=kana
    )
    if stroke_index not in progress.completed_strokes:
        progress.completed_strokes.append(stroke_index)
        if len(progress.completed_strokes) == kana.total_strokes:
            progress.completed = True
        progress.save()

    # Trả về kết quả thành công kèm snapped_svg
    return Response({
        'success': True,
        'correct': True,
        'similarity': score,
        'snapped_svg': template_svg,
        'completed': progress.completed,
        'completed_strokes': progress.completed_strokes
    }, status=status.HTTP_200_OK)