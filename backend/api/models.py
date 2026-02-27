import uuid
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from datetime import date, timedelta

# 1. Bảng từ điển gốc (Dữ liệu chuẩn của hệ thống)
class Vocabulary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    word = models.CharField(max_length=255, unique=True)
    meaning = models.TextField()
    image_url = models.URLField(max_length=500, blank=True, null=True)
    example_sentence = models.TextField(blank=True, null=True)
    example_translation = models.TextField(blank=True, null=True)
    pronunciation = models.CharField(max_length=255, blank=True, null=True)
    class_name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.word

# 2. Thông tin bổ sung của User (Dùng để cache chỉ số Streak & Thống kê)
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    total_vocab_learned = models.IntegerField(default=0) # Cache tổng số từ đã học

    def __str__(self):
        return f"Profile of {self.user.username}"

# 3. Bộ sưu tập theo ngày (Lịch sử học tập - Dùng cho Lịch/Calendar)
class Collection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    date_key = models.DateField() 
    title = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'date_key')
        indexes = [models.Index(fields=['user', 'date_key'])]

    def __str__(self):
        return f"{self.user.username} - {self.title or self.date_key}"

# 4. Chi tiết từ vựng đã lưu (Kèm ảnh user chụp thực tế)
class SavedVocabulary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='saved_vocabularies')
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.CASCADE, related_name='saved_instances')
    user_image = models.URLField(max_length=500, blank=True, null=True)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('collection', 'vocabulary')
        indexes = [models.Index(fields=['collection', 'saved_at'])]

# 5. Tiến độ học tập (Hỗ trợ Spaced Repetition)
class LearningProgress(models.Model):
    STATUS_CHOICES = [
        ('learning', 'Đang học'),
        ('review', 'Ôn tập'),
        ('mastered', 'Đã thuộc'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_progress')
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.CASCADE, related_name='learning_progress')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='learning')
    review_count = models.IntegerField(default=0)
    last_reviewed = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'vocabulary')
        indexes = [models.Index(fields=['user', 'status', 'last_reviewed'])]

# 6. Danh sách Danh hiệu hệ thống (Achievement Master Data)
class Achievement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50) 
    requirement_type = models.CharField(max_length=50) # 'streak' hoặc 'total_vocab'
    requirement_value = models.IntegerField()

    def __str__(self):
        return self.name

# 7. Danh hiệu User đã thực sự đạt được
class UserAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    achieved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'achievement')

# --- LOGIC TỰ ĐỘNG (SIGNALS) ---

@receiver(post_save, sender=SavedVocabulary)
def update_user_stats(sender, instance, created, **kwargs):
    """
    Tự động cập nhật Streak và tổng số từ ngay khi user lưu từ vựng mới.
    """
    if created:
        user = instance.collection.user
        with transaction.atomic():
            # Đảm bảo Profile luôn tồn tại
            profile, _ = UserProfile.objects.get_or_create(user=user)
            today = date.today()
            
            # 1. Tăng tổng số từ đã học
            profile.total_vocab_learned += 1
            
            # 2. Tính toán Streak
            if profile.last_activity_date:
                if profile.last_activity_date == today:
                    # Nếu hôm nay đã học rồi thì không tăng thêm streak nữa
                    pass
                elif profile.last_activity_date == today - timedelta(days=1):
                    # Nếu hôm qua có học (liên tiếp) -> tăng streak
                    profile.current_streak += 1
                else:
                    # Nếu bỏ bẵng 1 ngày trở lên -> reset streak về 1
                    profile.current_streak = 1
            else:
                # Lần đầu tiên học trong đời
                profile.current_streak = 1
            
            # 3. Cập nhật kỷ lục Streak cao nhất
            if profile.current_streak > profile.longest_streak:
                profile.longest_streak = profile.current_streak
            
            # 4. Cập nhật ngày hoạt động cuối cùng
            profile.last_activity_date = today
            profile.save()

            # 5. Tự động kiểm tra danh hiệu (Tùy chọn thêm sau này)
            # check_and_assign_achievements(profile)