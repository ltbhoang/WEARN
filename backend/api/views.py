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
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework import filters
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth.hashers import check_password
from django.core.files.storage import default_storage

from datetime import timedelta
from django.utils import timezone

import os
import uuid
import base64
from django.conf import settings
from django.core.files.base import ContentFile
from urllib.parse import urlparse

from api.serializers.collection_serializers import CollectionDetailSerializer
from .models import Collection, UserProfile, Vocabulary, LearningProgress, SavedVocabulary, FlashcardSet, FlashcardSetItem, Lesson, KanaCharacter, UserLessonProgress, UserKanaStrokeProgress, update_user_activity
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
    UserKanaProgressSerializer,
    AddVocabularyToSetSerializer  
)

# 1. Vocabulary: Từ điển chung, chỉ đọc
class VocabularyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Vocabulary.objects.all()
    serializer_class = VocabularySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'class_name'
    filter_backends = [filters.SearchFilter]
    search_fields = ['word', 'meaning', 'pronunciation', 'reading_hiragana']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Lọc theo class_name (chính xác)
        class_name = self.request.query_params.get('class_name')
        if class_name:
            queryset = queryset.filter(class_name=class_name)
        # Lọc theo topic
        topic = self.request.query_params.get('topic')
        if topic:
            queryset = queryset.filter(topic=topic)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'], url_path='topics')
    def list_topics(self, request):
        topics = (
            Vocabulary.objects
            .exclude(topic__isnull=True)
            .exclude(topic='')
            .values_list('topic', flat=True)
            .distinct()
            .order_by('topic')
        )
        return Response(list(topics))

    @action(detail=False, methods=['get'], url_path='all-by-topic')
    def all_by_topic(self, request):
        queryset = Vocabulary.objects.exclude(topic__isnull=True).exclude(topic='')
        grouped = {}
        for vocab in queryset:
            topic = vocab.topic
            if topic not in grouped:
                grouped[topic] = []
            serializer = self.get_serializer(vocab)  # dùng VocabularySerializer đã có audio_url
            grouped[topic].append(serializer.data)
        return Response(grouped)

# 2. Collection: Của ai người đó thấy
class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Collection.objects.filter(user=self.request.user).order_by('-date_key')
        date_key = self.request.query_params.get('date_key')
        if date_key:
            queryset = queryset.filter(date_key=date_key)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CollectionDetailSerializer
        return CollectionSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

# 3. Tiến độ học tập: Riêng tư
class LearningProgressViewSet(viewsets.ModelViewSet):
    queryset = LearningProgress.objects.all()
    serializer_class = LearningProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LearningProgress.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

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
        flashcard_set = serializer.save(user=self.request.user)
        print(f"[DEBUG] Created flashcard set {flashcard_set.id} with {flashcard_set.items.count()} items")
        for item in flashcard_set.items.all():
            vocab = None
            if item.saved_vocab:
                vocab = item.saved_vocab.vocabulary
            elif item.vocabulary:
                vocab = item.vocabulary
            if vocab:
                try:
                    init_learning_progress(self.request.user, vocab)
                    print(f"[DEBUG] OK - init_learning_progress called for {vocab.word}")
                except Exception as e:
                    print(f"[ERROR] init_learning_progress failed for {vocab.word}: {e}")
            else:
                print(f"[WARN] No vocabulary found for item {item.id}")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_vocab(self, request, pk=None):
        flashcard_set = self.get_object()
        serializer = AddVocabularyToSetSerializer(
            data=request.data,
            context={'request': request, 'set_id': flashcard_set.id}
        )
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        update_user_activity(request.user)

        # Xác định vocabulary từ item
        vocab = None
        if item.saved_vocab:
            vocab = item.saved_vocab.vocabulary
        elif item.vocabulary:
            vocab = item.vocabulary
        if vocab:
            init_learning_progress(request.user, vocab)

        item_serializer = FlashcardSetItemSerializer(item)
        return Response(item_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_vocab(self, request, pk=None):
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
        instance = serializer.save()
        # Nếu có thay đổi memorized, cập nhật activity
        if 'memorized' in serializer.validated_data:
            update_user_activity(self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def bulk_update_memorized(self, request):
        items_data = request.data.get('items', [])
        updated = False
        for item_data in items_data:
            try:
                item = FlashcardSetItem.objects.get(
                    id=item_data['id'],
                    flashcard_set__user=request.user
                )
                new_memorized = item_data.get('memorized', item.memorized)
                if new_memorized != item.memorized:
                    updated = True
                item.memorized = new_memorized
                item.save()
            except FlashcardSetItem.DoesNotExist:
                continue
        if updated:
            update_user_activity(request.user)
        return Response({'status': 'updated successfully'})

class SavedVocabularyViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SavedVocabularySerializer

    def get_queryset(self):
        queryset = SavedVocabulary.objects.filter(collection__user=self.request.user).order_by('-saved_at')
        # Lọc theo collection nếu có param
        collection_id = self.request.query_params.get('collection')
        if collection_id:
            queryset = queryset.filter(collection_id=collection_id)
        # Lọc theo vocabulary nếu có param
        vocabulary_id = self.request.query_params.get('vocabulary')
        if vocabulary_id:
            queryset = queryset.filter(vocabulary_id=vocabulary_id)
        return queryset

    def perform_create(self, serializer):
        collection = serializer.validated_data.get('collection')
        if not collection:
            from rest_framework import serializers as drf_serializers
            raise drf_serializers.ValidationError({"collection": "This field is required."})
        if collection.user != self.request.user:
            raise PermissionDenied("You don't own this collection")
        saved_vocab = serializer.save()
        # Tự động tạo learning progress cho từ vựng vừa lưu
        init_learning_progress(self.request.user, saved_vocab.vocabulary)

# 6. Lesson ViewSet (chỉ đọc + action hoàn thành bài học)
class LessonViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Lesson.objects.all().order_by('order')
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_lesson(self, request, pk=None):
        lesson = self.get_object()
        progress, created = UserLessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson
        )
        if not progress.completed:
            progress.completed = True
            progress.completed_at = timezone.now()
            progress.save()
            update_user_activity(request.user)
            return Response({'status': 'completed'}, status=status.HTTP_200_OK)
        return Response({'status': 'already completed'}, status=status.HTTP_200_OK)


# 7. API lấy chi tiết một Kana (kèm strokes)
@api_view(['GET'])
def kana_detail(request, pk):
    if not request.user.is_authenticated:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        kana = KanaCharacter.objects.get(pk=pk)
    except ObjectDoesNotExist:
        return Response({'error': 'Kana not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = KanaStrokeSerializer(kana, context={'request': request})
    return Response(serializer.data)


# 8. API lấy tiến độ vẽ nét của user cho một Kana cụ thể
@api_view(['GET'])
def user_kana_progress(request, kana_id):
    if not request.user.is_authenticated:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        progress = UserKanaStrokeProgress.objects.get(user=request.user, kana_id=kana_id)
        serializer = UserKanaProgressSerializer(progress, context={'request': request})
        return Response(serializer.data)
    except ObjectDoesNotExist:
        return Response({'completed_strokes': [], 'completed': False})


# 9. API cập nhật tiến độ khi user hoàn thành một nét
@api_view(['POST'])
def complete_stroke(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    kana_id = request.data.get('kana_id')
    stroke_index = request.data.get('stroke_index')
    user_svg = request.data.get('user_svg')

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

    def svg_to_array(svg_str):
        try:
            png_data = cairosvg.svg2png(bytestring=svg_str.encode('utf-8'))
            img = Image.open(BytesIO(png_data)).convert('L')
            img = img.resize((300, 300))
            return np.array(img)
        except Exception as e:
            raise ValueError(f"SVG conversion error: {e}")

    try:
        user_arr = svg_to_array(user_svg)
        template_arr = svg_to_array(template_svg)
        score = ssim(user_arr, template_arr)
        correct = score >= 0.8
    except Exception as e:
        return Response({'error': f'Comparison failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    if not correct:
        return Response({
            'success': False,
            'correct': False,
            'similarity': score
        }, status=status.HTTP_200_OK)

    progress, created = UserKanaStrokeProgress.objects.get_or_create(
        user=request.user,
        kana=kana
    )
    if stroke_index not in progress.completed_strokes:
        progress.completed_strokes.append(stroke_index)
        if len(progress.completed_strokes) == kana.total_strokes:
            progress.completed = True
        progress.save()
        # Cập nhật streak
        update_user_activity(request.user)

    return Response({
        'success': True,
        'correct': True,
        'similarity': score,
        'snapped_svg': template_svg,
        'completed': progress.completed,
        'completed_strokes': progress.completed_strokes
    }, status=status.HTTP_200_OK)
    
class UpdateProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user = request.user
        data = request.data
        if 'fullName' in data:
            user.first_name = data['fullName']
            user.save()
        if 'bio' in data:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.bio = data['bio']
            profile.save()
        if 'avatar_url' in data:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.avatar_url = data['avatar_url']
            # Xóa avatar cũ nếu có? Có thể giữ lại hoặc xóa tùy ý
            profile.save()
        return Response({'status': 'ok'})

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current = request.data.get('currentPassword')
        new = request.data.get('newPassword')
        if not check_password(current, user.password):
            return Response({'error': 'Mật khẩu hiện tại không đúng'}, status=400)
        if len(new) < 6:
            return Response({'error': 'Mật khẩu mới quá ngắn'}, status=400)
        user.set_password(new)
        user.save()
        return Response({'status': 'ok'})

class UploadAvatarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('avatar')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if profile.avatar:
            default_storage.delete(profile.avatar.path)
        profile.avatar = file
        profile.save()
        avatar_url = request.build_absolute_uri(profile.avatar.url)
        return Response({'avatar_url': avatar_url})
    
# api/views.py - thêm vào cuối
class UserProfileDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        avatar_display = profile.avatar.url if profile.avatar else (profile.avatar_url or None)
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'bio': profile.bio,
            'avatar': avatar_display,
            'total_vocab_learned': profile.total_vocab_learned,
        })
        
class UploadTempImageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        image_base64 = request.data.get('image_base64')
        if not image_base64:
            return Response({'error': 'Missing image_base64'}, status=400)

        try:
            # Kiểm tra định dạng base64 hợp lệ
            if ';base64,' not in image_base64:
                return Response({'error': 'Invalid base64 format'}, status=400)

            format, imgstr = image_base64.split(';base64,')
            ext = format.split('/')[-1]
            if ext not in ['jpeg', 'jpg', 'png']:
                ext = 'jpg'

            file_name = f"temp_{uuid.uuid4().hex}.{ext}"
            file_content = ContentFile(base64.b64decode(imgstr), name=file_name)

            # Tạo thư mục temp nếu chưa tồn tại
            temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
            os.makedirs(temp_dir, exist_ok=True)

            file_path = os.path.join('temp', file_name)
            saved_path = default_storage.save(file_path, file_content)

            # Tạo URL tuyệt đối
            image_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)
            return Response({'image_url': image_url}, status=200)

        except Exception as e:
            return Response({'error': f'Upload failed: {str(e)}'}, status=500)        
        
class DeleteTempImageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        image_url = request.data.get('image_url')
        if not image_url:
            return Response({'error': 'Missing image_url'}, status=400)

        parsed = urlparse(image_url)
        path = parsed.path

        # Kiểm tra đường dẫn có đúng MEDIA_URL không
        if not path.startswith(settings.MEDIA_URL):
            return Response({'error': 'Invalid media URL'}, status=400)

        relative_path = path[len(settings.MEDIA_URL):]
        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)

        # Chỉ cho phép xóa file trong thư mục 'temp'
        if os.path.exists(file_path) and relative_path.startswith('temp/'):
            os.remove(file_path)
            return Response({'status': 'deleted', 'path': relative_path})
        return Response({'error': 'File not found or not a temp file'}, status=404)
    
def update_learning_progress(user, vocabulary, grade, review_date=None):
    """
    Cập nhật LearningProgress theo thuật toán SM-2.
    grade: 0 (quên hoàn toàn) -> 5 (nhớ hoàn hảo)
    """
    if review_date is None:
        review_date = timezone.now().date()

    progress, created = LearningProgress.objects.get_or_create(
        user=user,
        vocabulary=vocabulary,
        defaults={
            'ease_factor': 2.5,
            'interval': 1,
            'next_review_date': review_date,
            'status': 'learning'
        }
    )

    # 1. Cập nhật Ease Factor
    if grade >= 3:
        progress.ease_factor += (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
        progress.ease_factor = max(1.3, progress.ease_factor)
    else:
        progress.ease_factor = max(1.3, progress.ease_factor - 0.2)

    # 2. Cập nhật Interval
    if grade < 3:
        progress.interval = 1
    else:
        if progress.interval == 1:
            progress.interval = 1
        elif progress.interval == 1 and progress.review_count == 1:
            progress.interval = 6
        else:
            progress.interval = int(round(progress.interval * progress.ease_factor))
        progress.interval = min(365, progress.interval)

    # 3. Ngày ôn tiếp theo
    progress.next_review_date = review_date + timedelta(days=progress.interval)

    progress.review_count += 1
    progress.last_reviewed = timezone.now()
    progress.status = 'mastered' if progress.interval >= 30 else 'review'
    progress.save()

    update_user_activity(user)
    return progress

def init_learning_progress(user, vocabulary):
    """Khởi tạo LearningProgress cho từ mới, ngày ôn là hôm nay."""
    today = timezone.now().date()
    progress, created = LearningProgress.objects.get_or_create(
        user=user,
        vocabulary=vocabulary,
        defaults={
            'ease_factor': 2.5,
            'interval': 1,
            'next_review_date': today,
            'review_count': 0,
            'status': 'learning'
        }
    )
    return progress

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def due_vocabularies(request):
    """Lấy danh sách từ vựng cần ôn hôm nay (tối đa 20)"""
    today = timezone.now().date()
    due_progress = LearningProgress.objects.filter(
        user=request.user,
        next_review_date__lte=today
    ).select_related('vocabulary').order_by('next_review_date')[:20]

    data = []
    for prog in due_progress:
        data.append({
            'progress_id': prog.id,
            'vocabulary_id': prog.vocabulary.id,
            'word': prog.vocabulary.word,
            'meaning': prog.vocabulary.meaning,
            'reading_hiragana': prog.vocabulary.reading_hiragana,
            'pronunciation': prog.vocabulary.pronunciation,
            'next_review_date': prog.next_review_date,
            'interval': prog.interval,
            'ease_factor': prog.ease_factor,
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_review(request):
    """Gửi kết quả ôn tập (grade) cho một từ vựng"""
    vocabulary_id = request.data.get('vocabulary_id')
    grade = request.data.get('grade')

    if not vocabulary_id or grade is None:
        return Response(
            {'error': 'Missing vocabulary_id or grade'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        grade = int(grade)
        if grade < 0 or grade > 5:
            raise ValueError
    except (TypeError, ValueError):
        return Response(
            {'error': 'Grade must be integer between 0 and 5'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        vocab = Vocabulary.objects.get(id=vocabulary_id)
    except Vocabulary.DoesNotExist:
        return Response(
            {'error': 'Vocabulary not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    progress = update_learning_progress(request.user, vocab, grade)

    return Response({
        'success': True,
        'next_review_date': progress.next_review_date,
        'interval': progress.interval,
        'ease_factor': progress.ease_factor,
    }, status=status.HTTP_200_OK)
    