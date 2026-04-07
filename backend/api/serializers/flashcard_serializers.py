from rest_framework import serializers
from api.models import FlashcardSet, FlashcardSetItem, SavedVocabulary, Vocabulary
from .vocabulary_serializers import VocabularySerializer, SavedVocabularySerializer
import logging

logger = logging.getLogger(__name__)

class FlashcardSetItemSerializer(serializers.ModelSerializer):
    vocabulary_detail = serializers.SerializerMethodField()
    user_image = serializers.SerializerMethodField()
    
    class Meta:
        model = FlashcardSetItem
        fields = [
            'id', 'flashcard_set', 'saved_vocab', 'order', 
            'memorized', 'added_at', 'vocabulary_detail', 'user_image'
        ]
        read_only_fields = ['id', 'added_at']

    def get_vocabulary_detail(self, obj):
        vocabulary = obj.saved_vocab.vocabulary
        return {
            'id': vocabulary.id,
            'word': vocabulary.word,
            'meaning': vocabulary.meaning,
            'pronunciation': vocabulary.pronunciation,
            'example_sentence': vocabulary.example_sentence,
            'example_translation': vocabulary.example_translation,
        }
    
    def get_user_image(self, obj):
        return obj.saved_vocab.user_image

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
    saved_vocab_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True
    )
    
    class Meta:
        model = FlashcardSet
        fields = ['id', 'name', 'description', 'saved_vocab_ids']
    
    def validate_saved_vocab_ids(self, value):
        if not value:
            raise serializers.ValidationError("Phải chọn ít nhất một từ vựng")
        
        unique_ids = list(set(value))
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Không xác định được user")
        
        existing_ids = set(SavedVocabulary.objects.filter(
            id__in=unique_ids,
            collection__user=request.user
        ).values_list('id', flat=True))
        
        invalid_ids = set(unique_ids) - existing_ids
        if invalid_ids:
            raise serializers.ValidationError(
                f"Các ID không tồn tại hoặc không thuộc về bạn: {invalid_ids}"
            )
        
        return list(existing_ids)
    
    def create(self, validated_data):
        saved_vocab_ids = validated_data.pop('saved_vocab_ids')
        
        # Lấy user từ validated_data (do serializer.save(user=...) thêm vào) hoặc từ context
        user = validated_data.pop('user', self.context['request'].user)
        
        flashcard_set = FlashcardSet.objects.create(user=user, **validated_data)
        
        items = [
            FlashcardSetItem(
                flashcard_set=flashcard_set,
                saved_vocab_id=sv_id,
                order=index
            )
            for index, sv_id in enumerate(saved_vocab_ids)
        ]
        
        try:
            FlashcardSetItem.objects.bulk_create(items)
        except Exception as e:
            flashcard_set.delete()
            logger.error(f"Error creating FlashcardSetItems: {e}")
            raise serializers.ValidationError(f"Không thể tạo các item: {str(e)}")
        
        return flashcard_set

class UpdateFlashcardSetItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashcardSetItem
        fields = ['memorized', 'order']