# api/serializers.py (đã sửa hoàn chỉnh)
from rest_framework import serializers
from ..models import UserProfile, UserAchievement, Achievement, Collection, LearningProgress
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

# Serializer cho từng danh hiệu hệ thống
class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'icon', 'requirement_type', 'requirement_value']

# Serializer tổng hợp cho trang Streak
class StreakSerializer(serializers.ModelSerializer):
    achievements = serializers.SerializerMethodField()
    activity_dates = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    
    # Ghi đè các field tính toán động
    current_streak = serializers.SerializerMethodField()
    longest_streak = serializers.SerializerMethodField()   # <-- thêm dòng này
    total_vocab_learned = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['current_streak', 'longest_streak', 'total_vocab_learned', 'stats', 'activity_dates', 'achievements']

    def get_current_streak(self, obj):
        from api.models import UserActivityLog
        user = obj.user
        today = timezone.now().date()
        dates = set(UserActivityLog.objects.filter(user=user, activity_date__lte=today).values_list('activity_date', flat=True))
        streak = 0
        check_date = today
        while check_date in dates:
            streak += 1
            check_date -= timedelta(days=1)
        return streak

    def get_longest_streak(self, obj):
        from api.models import UserActivityLog
        user = obj.user
        dates = UserActivityLog.objects.filter(user=user).order_by('activity_date').values_list('activity_date', flat=True)
        if not dates:
            return 0
        max_streak = 1
        current = 1
        dates_list = list(dates)
        for i in range(1, len(dates_list)):
            if dates_list[i] == dates_list[i-1] + timedelta(days=1):
                current += 1
                if current > max_streak:
                    max_streak = current
            else:
                current = 1
        return max_streak

    def get_total_vocab_learned(self, obj):
        return Collection.objects.filter(user=obj.user).aggregate(
            total=Count('saved_vocabularies__vocabulary', distinct=True)
        )['total'] or 0

    def get_stats(self, obj):
        user = obj.user
        total = self.get_total_vocab_learned(obj)
        mastered = LearningProgress.objects.filter(user=user, status='mastered').count()
        review = LearningProgress.objects.filter(user=user, status='review').count()
        percent = round((mastered / total * 100), 1) if total > 0 else 0
        return {
            "total_learned": total,
            "percent_complete": percent,
            "memorized": mastered,
            "need_review": review
        }

    def get_activity_dates(self, obj):
        from api.models import UserActivityLog
        return UserActivityLog.objects.filter(user=obj.user).values_list('activity_date', flat=True)

    def get_achievements(self, obj):
        user = obj.user
        all_ach = Achievement.objects.all()
        achieved_ids = UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True)
        result = []
        for ach in all_ach:
            result.append({
                "id": ach.id,
                "name": ach.name,
                "description": ach.description,
                "icon": ach.icon,
                "requirement_value": ach.requirement_value,
                "achieved": ach.id in achieved_ids
            })
        return result