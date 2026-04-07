from rest_framework import serializers
from api.models import KanaCharacter, Lesson, UserLessonProgress, UserKanaStrokeProgress

class KanaSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = KanaCharacter
        fields = ['id', 'character', 'type', 'romanji', 'total_strokes']

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

class KanaStrokeSerializer(serializers.ModelSerializer):
    class Meta:
        model = KanaCharacter
        fields = ['id', 'character', 'type', 'romanji', 'strokes', 'total_strokes', 'svg_content']

class UserKanaProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserKanaStrokeProgress
        fields = ['kana', 'completed_strokes', 'completed']