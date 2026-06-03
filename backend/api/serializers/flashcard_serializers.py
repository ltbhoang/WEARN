from rest_framework import serializers
from api.models import FlashcardSet, FlashcardSetItem, SavedVocabulary, Vocabulary
from .vocabulary_serializers import VocabularySerializer, SavedVocabularySerializer
import logging
from django.db import models, transaction

logger = logging.getLogger(__name__)


class FlashcardSetItemSerializer(serializers.ModelSerializer):
    vocabulary_detail = serializers.SerializerMethodField()
    user_image = serializers.SerializerMethodField()
    source_type = serializers.SerializerMethodField()

    class Meta:
        model = FlashcardSetItem
        fields = [
            'id', 'flashcard_set', 'saved_vocab', 'vocabulary', 'order',
            'memorized', 'added_at', 'vocabulary_detail', 'user_image', 'source_type'
        ]
        read_only_fields = ['id', 'added_at']

    def get_vocabulary_detail(self, obj):
        if obj.saved_vocab:
            vocabulary = obj.saved_vocab.vocabulary
        elif obj.vocabulary:
            vocabulary = obj.vocabulary
        else:
            return None
        # 👇 Quan trọng: dùng VocabularySerializer để có audio_url
        return VocabularySerializer(vocabulary, context=self.context).data

    def get_user_image(self, obj):
        return obj.saved_vocab.user_image if obj.saved_vocab else None

    def get_source_type(self, obj):
        if obj.saved_vocab:
            return 'camera'
        elif obj.vocabulary:
            return 'system'
        return None


class FlashcardSetSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    memorized_count = serializers.SerializerMethodField()
    items = FlashcardSetItemSerializer(many=True, read_only=True)

    class Meta:
        model = FlashcardSet
        fields = [
            'id', 'name', 'description', 'created_at',
            'updated_at', 'item_count', 'memorized_count', 'items'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

    def get_item_count(self, obj):
        return obj.items.count()

    def get_memorized_count(self, obj):
        return obj.items.filter(memorized=True).count()


class CreateFlashcardSetSerializer(serializers.ModelSerializer):
    items = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=True
    )

    class Meta:
        model = FlashcardSet
        fields = ['id', 'name', 'description', 'items']

    def validate_items(self, value):
        """Kiểm tra và lọc các item hợp lệ, trả về danh sách các tuple (type, id) theo đúng thứ tự."""
        if not value:
            raise serializers.ValidationError("Phải chọn ít nhất một từ vựng")
        if len(value) > 200:
            raise serializers.ValidationError("Mỗi bộ tối đa 200 từ")

        camera_ids = []
        system_ids = []
        for item in value:
            item_type = item.get('type')
            item_id = item.get('id')
            if not item_type or not item_id:
                raise serializers.ValidationError("Mỗi item phải có 'type' và 'id'")
            if item_type == 'camera':
                camera_ids.append(item_id)
            elif item_type == 'system':
                system_ids.append(item_id)
            else:
                raise serializers.ValidationError(f"Type không hợp lệ: {item_type}")

        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Không xác định được user")

        user = request.user

        # Lấy các SavedVocabulary hợp lệ (thuộc user) - trả về set các string UUID
        valid_camera_ids = set()
        if camera_ids:
            existing_camera = SavedVocabulary.objects.filter(
                id__in=camera_ids,
                collection__user=user
            ).values_list('id', flat=True)
            valid_camera_ids = {str(uuid) for uuid in existing_camera}
            invalid_camera_ids = set(camera_ids) - valid_camera_ids
            if invalid_camera_ids:
                logger.warning(
                    f"User {user.id} gửi camera IDs không hợp lệ: {invalid_camera_ids}"
                )

        # Lấy các Vocabulary hợp lệ (tồn tại trong hệ thống)
        valid_system_ids = set()
        if system_ids:
            existing_system = Vocabulary.objects.filter(
                id__in=system_ids
            ).values_list('id', flat=True)
            valid_system_ids = {str(uuid) for uuid in existing_system}
            invalid_system_ids = set(system_ids) - valid_system_ids
            if invalid_system_ids:
                raise serializers.ValidationError(
                    f"Các từ hệ thống không tồn tại: {invalid_system_ids}"
                )

        # Xây dựng danh sách các cặp (type, id) hợp lệ theo đúng thứ tự ban đầu
        filtered_items = []
        for item in value:
            item_type = item['type']
            item_id = item['id']
            if item_type == 'camera' and item_id in valid_camera_ids:
                filtered_items.append(('camera', item_id))
            elif item_type == 'system' and item_id in valid_system_ids:
                filtered_items.append(('system', item_id))

        if not filtered_items:
            raise serializers.ValidationError(
                "Không có từ vựng hợp lệ nào để tạo bộ. Kiểm tra lại các từ camera (phải thuộc về bạn) và từ hệ thống."
            )

        return filtered_items

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        if not items_data:
            raise serializers.ValidationError("Danh sách từ vựng không hợp lệ")

        user = self.context['request'].user
        # Loại bỏ 'user' nếu có trong validated_data (tránh xung đột)
        validated_data.pop('user', None)
        # Tạo FlashcardSet
        flashcard_set = FlashcardSet.objects.create(user=user, **validated_data)

        # Tạo các FlashcardSetItem
        flashcard_items = []
        for order, (item_type, obj_id) in enumerate(items_data):
            if item_type == 'camera':
                flashcard_items.append(
                    FlashcardSetItem(
                        flashcard_set=flashcard_set,
                        saved_vocab_id=obj_id,
                        order=order
                    )
                )
            else:  # system
                flashcard_items.append(
                    FlashcardSetItem(
                        flashcard_set=flashcard_set,
                        vocabulary_id=obj_id,
                        order=order
                    )
                )

        try:
            if flashcard_items:
                FlashcardSetItem.objects.bulk_create(flashcard_items)
        except Exception as e:
            logger.error(f"Lỗi khi bulk_create FlashcardSetItem: {e}", exc_info=True)
            flashcard_set.delete()
            raise serializers.ValidationError(f"Không thể tạo các item: {str(e)}")

        return flashcard_set


class UpdateFlashcardSetItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashcardSetItem
        fields = ['memorized', 'order']


class AddVocabularyToSetSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=['camera', 'system'])
    id = serializers.UUIDField()

    def validate(self, data):
        user = self.context['request'].user
        set_id = self.context['set_id']

        try:
            flashcard_set = FlashcardSet.objects.get(id=set_id, user=user)
        except FlashcardSet.DoesNotExist:
            raise serializers.ValidationError("Bộ flashcard không tồn tại hoặc không thuộc về bạn")

        if data['type'] == 'camera':
            try:
                saved_vocab = SavedVocabulary.objects.get(id=data['id'], collection__user=user)
            except SavedVocabulary.DoesNotExist:
                raise serializers.ValidationError("Từ camera không tồn tại hoặc không thuộc về bạn")
            if FlashcardSetItem.objects.filter(flashcard_set=flashcard_set, saved_vocab=saved_vocab).exists():
                raise serializers.ValidationError("Từ này đã có trong bộ")
            data['saved_vocab'] = saved_vocab
        else:
            try:
                vocabulary = Vocabulary.objects.get(id=data['id'])
            except Vocabulary.DoesNotExist:
                raise serializers.ValidationError("Từ hệ thống không tồn tại")
            if FlashcardSetItem.objects.filter(flashcard_set=flashcard_set, vocabulary=vocabulary).exists():
                raise serializers.ValidationError("Từ này đã có trong bộ")
            data['vocabulary'] = vocabulary

        data['flashcard_set'] = flashcard_set
        return data

    def create(self, validated_data):
        max_order = FlashcardSetItem.objects.filter(
            flashcard_set=validated_data['flashcard_set']
        ).aggregate(models.Max('order'))['order__max'] or -1
        item = FlashcardSetItem.objects.create(
            flashcard_set=validated_data['flashcard_set'],
            saved_vocab=validated_data.get('saved_vocab'),
            vocabulary=validated_data.get('vocabulary'),
            order=max_order + 1
        )
        return item