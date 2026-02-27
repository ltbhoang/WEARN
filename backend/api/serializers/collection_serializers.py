from rest_framework import serializers # type: ignore
from ..models import Collection, SavedVocabulary # type: ignore

class CollectionSerializer(serializers.ModelSerializer):
    vocab_count = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField() # Đổi cái này

    class Meta:
        model = Collection
        fields = ['id', 'title', 'date_key', 'created_at', 'vocab_count', 'images']

    def get_vocab_count(self, obj):
        return obj.saved_vocabularies.count()

    def get_images(self, obj):
        # Lấy tối đa 4 ảnh của các từ vựng trong bộ này
        return [sv.user_image for sv in obj.saved_vocabularies.all()[:4] if sv.user_image]

class SavedVocabularySerializer(serializers.ModelSerializer):
    # Lấy thông tin từ bảng Vocabulary gốc (chữ Hán, nghĩa, ví dụ...)
    word = serializers.ReadOnlyField(source='vocabulary.word')
    meaning = serializers.ReadOnlyField(source='vocabulary.meaning')
    pronunciation = serializers.ReadOnlyField(source='vocabulary.pronunciation')
    example_sentence = serializers.ReadOnlyField(source='vocabulary.example_sentence')
    example_translation = serializers.ReadOnlyField(source='vocabulary.example_translation')

    class Meta:
        model = SavedVocabulary
        fields = ['id', 'word', 'meaning', 'pronunciation', 'example_sentence', 'example_translation', 'user_image', 'saved_at']
        
            
class CollectionDetailSerializer(serializers.ModelSerializer):
    # Lồng cái SavedVocabularySerializer vào đây để lấy danh sách từ vựng
    vocabularies = SavedVocabularySerializer(source='saved_vocabularies', many=True, read_only=True)
    
    class Meta:
        model = Collection
        fields = ['id', 'title', 'date_key', 'vocabularies']