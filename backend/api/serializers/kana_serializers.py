from rest_framework import serializers
from api.models import KanaCharacter, Lesson, UserLessonProgress, UserKanaStrokeProgress

# Mixin để tái sử dụng logic lấy audio_url
class KanaAudioUrlMixin:
    def get_audio_url(self, obj):
        if obj.audio:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.audio.url)
            return obj.audio.url
        return None

class KanaSimpleSerializer(KanaAudioUrlMixin, serializers.ModelSerializer):
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = KanaCharacter
        fields = ['id', 'character', 'type', 'romanji', 'total_strokes', 'audio_url']

class LessonSerializer(serializers.ModelSerializer):
    kanas = KanaSimpleSerializer(many=True, read_only=True)
    user_completed = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'name', 'order', 'kanas', 'user_completed']

    def get_user_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = UserLessonProgress.objects.filter(user=request.user, lesson=obj).first()
            return progress.completed if progress else False
        return False

class KanaStrokeSerializer(KanaAudioUrlMixin, serializers.ModelSerializer):
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = KanaCharacter
        fields = ['id', 'character', 'type', 'romanji', 'strokes', 'total_strokes', 'svg_content', 'audio_url']

class UserKanaProgressSerializer(serializers.ModelSerializer):
    # Nếu cần thông tin kana kèm audio khi trả về progress, bạn có thể nested serializer
    kana_detail = KanaSimpleSerializer(source='kana', read_only=True)

    class Meta:
        model = UserKanaStrokeProgress
        fields = ['kana', 'completed_strokes', 'completed', 'kana_detail']