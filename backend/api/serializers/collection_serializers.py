from rest_framework import serializers # type: ignore
from ..models import Collection, SavedVocabulary, Vocabulary # type: ignore

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
    collection = serializers.PrimaryKeyRelatedField(queryset=Collection.objects.all())
    vocabulary = serializers.PrimaryKeyRelatedField(queryset=Vocabulary.objects.all())
    word = serializers.ReadOnlyField(source='vocabulary.word')
    meaning = serializers.ReadOnlyField(source='vocabulary.meaning')
    pronunciation = serializers.ReadOnlyField(source='vocabulary.pronunciation')
    example_sentence = serializers.ReadOnlyField(source='vocabulary.example_sentence')
    example_translation = serializers.ReadOnlyField(source='vocabulary.example_translation')
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = SavedVocabulary
        fields = [
            'id', 'collection', 'vocabulary', 'user_image', 'saved_at',
            'word', 'meaning', 'pronunciation', 'example_sentence', 'example_translation', 'audio_url'
        ]
    def get_audio_url(self, obj):
        if obj.vocabulary and obj.vocabulary.audio:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.vocabulary.audio.url)
            return obj.vocabulary.audio.url
        return None
            
class CollectionDetailSerializer(serializers.ModelSerializer):
    # Lồng cái SavedVocabularySerializer vào đây để lấy danh sách từ vựng
    vocabularies = SavedVocabularySerializer(source='saved_vocabularies', many=True, read_only=True)
    
    class Meta:
        model = Collection
        fields = ['id', 'title', 'date_key', 'vocabularies']