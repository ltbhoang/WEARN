from rest_framework import serializers
from ..models import Vocabulary, LearningProgress, SavedVocabulary, Collection

class AudioUrlMixin:
    def get_audio_url(self, obj):
        if hasattr(obj, 'audio') and obj.audio:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.audio.url)
            return obj.audio.url
        return None

class VocabularySerializer(AudioUrlMixin, serializers.ModelSerializer):
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = Vocabulary
        fields = '__all__'

    def get_audio_url(self, obj):
        return super().get_audio_url(obj)

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

class LearningProgressSerializer(serializers.ModelSerializer):
    word_name = serializers.ReadOnlyField(source='vocabulary.word')
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = LearningProgress
        fields = '__all__'

    def get_audio_url(self, obj):
        if obj.vocabulary and obj.vocabulary.audio:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.vocabulary.audio.url)
            return obj.vocabulary.audio.url
        return None