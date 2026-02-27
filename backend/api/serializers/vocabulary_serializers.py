from rest_framework import serializers # type: ignore
from ..models import Vocabulary, LearningProgress, SavedVocabulary

class VocabularySerializer(serializers.ModelSerializer):
    class Meta:
        model = Vocabulary
        fields = '__all__'

# Thêm cái này để hiển thị từ vựng bên trong Collection
class SavedVocabularySerializer(serializers.ModelSerializer):
    vocabulary_details = VocabularySerializer(source='vocabulary', read_only=True)
    
    class Meta:
        model = SavedVocabulary
        fields = ['id', 'vocabulary', 'vocabulary_details', 'user_image', 'saved_at']

class LearningProgressSerializer(serializers.ModelSerializer):
    word_name = serializers.ReadOnlyField(source='vocabulary.word')
    class Meta:
        model = LearningProgress
        fields = '__all__'