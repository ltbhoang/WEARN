# api/serializers.py (đã sửa)
from rest_framework import serializers # type: ignore
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
    
    # --- THÊM CÁC FIELD TÍNH TOÁN ĐỘNG ---
    current_streak = serializers.SerializerMethodField()
    total_vocab_learned = serializers.SerializerMethodField()
    # -------------------------------------

    class Meta:
        model = UserProfile
        # Sử dụng các field tính toán động thay vì field tĩnh của model
        fields = ['current_streak', 'longest_streak', 'total_vocab_learned', 'stats', 'activity_dates', 'achievements']

    def get_current_streak(self, obj):
        # Tính toán streak dựa trên các ngày đã tạo Collection
        user = obj.user
        today = timezone.now().date()
        streak = 0
        check_date = today
        
        # Nếu hôm nay chưa học, kiểm tra xem hôm qua đã học chưa để giữ streak
        if not Collection.objects.filter(user=user, date_key=today).exists():
            check_date = today - timedelta(days=1)
        
        # Đếm ngược lại
        while Collection.objects.filter(user=user, date_key=check_date).exists():
            streak += 1
            check_date -= timedelta(days=1)
        return streak

    def get_total_vocab_learned(self, obj):
        # SỬA LỖI Ở ĐÂY: savedvocabulary -> saved_vocabularies
        return Collection.objects.filter(user=obj.user).aggregate(
            total=Count('saved_vocabularies__vocabulary', distinct=True)
        )['total'] or 0

    def get_stats(self, obj):
        # Tính toán các chỉ số cho Stats Grid
        user = obj.user
        
        # Lấy tổng từ vựng từ hàm tính toán động ở trên
        total = self.get_total_vocab_learned(obj)
        
        # Đếm trạng thái từ LearningProgress
        mastered = LearningProgress.objects.filter(user=user, status='mastered').count()
        review = LearningProgress.objects.filter(user=user, status='review').count()
        
        # Tránh chia cho 0
        percent = round((mastered / total * 100), 1) if total > 0 else 0
        
        return {
            "total_learned": total,
            "percent_complete": percent,
            "memorized": mastered,
            "need_review": review
        }

    def get_activity_dates(self, obj):
        # Lấy danh sách các ngày có tạo Collection để tô màu lịch
        return Collection.objects.filter(user=obj.user).values_list('date_key', flat=True)

    def get_achievements(self, obj):
        user = obj.user
        # Lấy tất cả danh hiệu hệ thống
        all_ach = Achievement.objects.all()
        # Lấy ID các danh hiệu user đã đạt
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