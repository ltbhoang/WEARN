import uuid
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from datetime import date, timedelta
from django.db.models import Q  # thêm dòng này cho UniqueConstraint

# 1. Bảng từ điển gốc (Dữ liệu chuẩn của hệ thống)
class Vocabulary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    word = models.CharField(max_length=255)               # chữ Nhật (kanji + hiragana)
    meaning = models.TextField()                                        # nghĩa tiếng Việt
    image_url = models.URLField(max_length=500, blank=True, null=True) # ảnh minh họa
    example_sentence = models.TextField(blank=True, null=True)         # câu ví dụ tiếng Nhật
    example_translation = models.TextField(blank=True, null=True)      # dịch câu ví dụ
    pronunciation = models.CharField(max_length=255, blank=True, null=True)  # romaji (cách đọc Latin)
    class_name = models.CharField(max_length=100, unique=True)         # mã định danh (n5_adj_abunai)
    topic = models.CharField(max_length=50, blank=True, null=True)      # chủ đề (tinhtu, dongtu...)
    reading_hiragana = models.CharField(max_length=255, blank=True, null=True) # cách đọc hiragana
    created_at = models.DateTimeField(auto_now_add=True)
    audio = models.FileField(upload_to='vocab_audio/', blank=True, null=True)

    def __str__(self):
        return f"{self.word} ({self.meaning})"

# 2. Thông tin bổ sung của User (Dùng để cache chỉ số Streak & Thống kê)
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    total_vocab_learned = models.IntegerField(default=0)  # Cache tổng số từ đã học
    # --- Bổ sung cho tính năng Kana ---
    has_passed_kana_test = models.BooleanField(default=False)  # Đã vượt qua bài test 10 câu random chưa
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
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
    next_review_date = models.DateField(null=True, blank=True, db_index=True)   # thêm db_index
    ease_factor = models.FloatField(default=2.5)                 # hệ số dễ
    interval = models.IntegerField(default=1)                    # khoảng cách (ngày)

    class Meta:
        unique_together = ('user', 'vocabulary')
        indexes = [
            models.Index(fields=['user', 'status', 'last_reviewed']),
            models.Index(fields=['user', 'next_review_date']),   # thêm index cho next_review_date
        ]

# 6. Danh sách Danh hiệu hệ thống (Achievement Master Data)
class Achievement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50) 
    requirement_type = models.CharField(max_length=50)  # 'streak' hoặc 'total_vocab'
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

# 8. Bộ Flashcard do người dùng tự tạo
class FlashcardSet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcard_sets')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'name')
        indexes = [models.Index(fields=['user', 'created_at'])]

    def __str__(self):
        return f"{self.user.username} - {self.name}"

# 9. Từ vựng trong một bộ Flashcard
class FlashcardSetItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    flashcard_set = models.ForeignKey(FlashcardSet, on_delete=models.CASCADE, related_name='items')
    # Cho phép null vì khi dùng từ hệ thống thì không có saved_vocab
    saved_vocab = models.ForeignKey(SavedVocabulary, on_delete=models.CASCADE, null=True, blank=True, related_name='flashcard_set_items')
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.CASCADE, null=True, blank=True, related_name='flashcard_set_items')
    order = models.PositiveIntegerField(default=0)
    memorized = models.BooleanField(default=False)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        constraints = [
            models.UniqueConstraint(fields=['flashcard_set', 'saved_vocab'], name='unique_set_saved_vocab'),
            models.UniqueConstraint(fields=['flashcard_set', 'vocabulary'], condition=Q(vocabulary__isnull=False), name='unique_set_vocabulary'),
        ]

    def __str__(self):
        if self.saved_vocab:
            return f"{self.flashcard_set.name} - {self.saved_vocab.vocabulary.word}"
        elif self.vocabulary:
            return f"{self.flashcard_set.name} - {self.vocabulary.word}"
        return f"{self.flashcard_set.name} - unknown"

# 10. Bảng chứa dữ liệu Hiragana / Katakana (dùng cho luyện viết và test)
class KanaCharacter(models.Model):
    KANA_TYPES = [
        ('hiragana', 'Hiragana'),
        ('katakana', 'Katakana'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    character = models.CharField(max_length=5)   # ký tự, ví dụ 'あ'
    type = models.CharField(max_length=10, choices=KANA_TYPES)
    romanji = models.CharField(max_length=50, blank=True)     # cách đọc, ví dụ 'a'
    svg_content = models.TextField()                          # nội dung file SVG
    unicode_decimal = models.IntegerField(unique=True, null=True, blank=True)
    # --- Bổ sung cho vẽ nét ---
    strokes = models.JSONField(default=list, blank=True)      # [{"order":1, "svg":"<svg>..."}, ...]
    total_strokes = models.IntegerField(default=0)            # số lượng nét
    audio = models.FileField(upload_to='kana_audio/', blank=True, null=True)
    def __str__(self):
        return f"{self.character} ({self.get_type_display()})"

# 11a. Bảng trung gian Lesson-Kana (có thứ tự)
class LessonKana(models.Model):
    lesson = models.ForeignKey('Lesson', on_delete=models.CASCADE)
    kana = models.ForeignKey('KanaCharacter', on_delete=models.CASCADE)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = ('lesson', 'kana')

    def __str__(self):
        return f"{self.lesson.name} - {self.kana.character} ({self.order})"

# 11. Bài học (Lesson)
class Lesson(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0)
    kanas = models.ManyToManyField(KanaCharacter, through='LessonKana', related_name='lessons')

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['order']

# 12. Tiến độ bài học của user
class UserLessonProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'lesson')

    def __str__(self):
        return f"{self.user.username} - {self.lesson.name} - {'Completed' if self.completed else 'In progress'}"


# 13. Tiến độ vẽ nét cho từng kana
class UserKanaStrokeProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kana_stroke_progress')
    kana = models.ForeignKey(KanaCharacter, on_delete=models.CASCADE)
    completed_strokes = models.JSONField(default=list)
    completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'kana')

    def __str__(self):
        return f"{self.user.username} - {self.kana.character} - {len(self.completed_strokes)}/{self.kana.total_strokes} strokes"

# 14. Lịch sử hoạt động của user (dùng cho streak)
class UserActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    activity_date = models.DateField()
    activity_type = models.CharField(max_length=50, blank=True, null=True)  # 'flashcard', 'lesson', 'vocabulary', ...
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'activity_date')
        ordering = ['-activity_date']

    def __str__(self):
        return f"{self.user.username} - {self.activity_date}"

# ------------------ HÀM KIỂM TRA VÀ GÁN DANH HIỆU ------------------
def check_and_assign_achievements(profile):
    """
    Kiểm tra và gán danh hiệu cho user dựa trên streak và tổng số từ đã học.
    Dùng get_or_create để tránh duplicate.
    """
    user = profile.user
    achieved_ids = UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True)
    potential_achievements = Achievement.objects.exclude(id__in=achieved_ids)

    for ach in potential_achievements:
        if ach.requirement_type == 'streak' and profile.longest_streak >= ach.requirement_value:
            UserAchievement.objects.get_or_create(user=user, achievement=ach)
        elif ach.requirement_type == 'total_vocab' and profile.total_vocab_learned >= ach.requirement_value:
            UserAchievement.objects.get_or_create(user=user, achievement=ach)


# ------------------ CẬP NHẬT STREAK & GHI NHẬN HOẠT ĐỘNG ------------------
def update_user_activity(user):
    """
    Cập nhật current_streak, longest_streak, last_activity_date và ghi nhận ngày hoạt động.
    Gọi ở các view: complete_lesson, complete_stroke, add_vocab, updateItemMemorized, ...
    """
    from django.utils import timezone
    from datetime import timedelta
    from .models import UserActivityLog  # import tại đây để tránh circular

    with transaction.atomic():
        profile, _ = UserProfile.objects.get_or_create(user=user)
        today = timezone.now().date()

        # Ghi nhận hoạt động (nếu chưa có)
        UserActivityLog.objects.get_or_create(user=user, activity_date=today)

        # Nếu đã cập nhật streak hôm nay thì thoát
        if profile.last_activity_date == today:
            return

        # Tính streak mới dựa trên last_activity_date
        if profile.last_activity_date == today - timedelta(days=1):
            profile.current_streak += 1
        else:
            profile.current_streak = 1

        # Cập nhật longest streak
        if profile.current_streak > profile.longest_streak:
            profile.longest_streak = profile.current_streak

        profile.last_activity_date = today
        profile.save()

        # Kiểm tra danh hiệu (streak và total_vocab)
        check_and_assign_achievements(profile)


# ------------------ SIGNAL: CẬP NHẬT TOTAL_VOCAB (CHỈ KHI THÊM SavedVocabulary) ------------------
@receiver(post_save, sender=SavedVocabulary)
def update_total_vocab_and_streak(sender, instance, created, **kwargs):
    if created:
        user = instance.collection.user
        with transaction.atomic():
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.total_vocab_learned += 1
            profile.save()
            # Kiểm tra danh hiệu ngay sau khi tăng total_vocab
            check_and_assign_achievements(profile)
        # Cập nhật streak (vẫn cần để ghi nhận hoạt động và cập nhật streak)
        update_user_activity(user)
        
# ------------------ HÀM ĐÁNH DẤU TỪ VỰNG ĐÃ THUỘC (MASTERED) ------------------
def mark_vocabulary_mastered(user, vocabulary):
    """
    Đánh dấu từ vựng đã thuộc (mastered) trong LearningProgress.
    Nếu chưa từng được đánh dấu mastered trước đó, tăng total_vocab_learned và kiểm tra danh hiệu.
    """
    from django.utils import timezone
    from .models import LearningProgress, UserProfile

    with transaction.atomic():
        # Kiểm tra xem đã có bản ghi LearningProgress với status='mastered' chưa
        mastered_exists = LearningProgress.objects.filter(
            user=user,
            vocabulary=vocabulary,
            status='mastered'
        ).exists()

        if not mastered_exists:
            # Tạo hoặc cập nhật LearningProgress thành mastered
            progress, created = LearningProgress.objects.get_or_create(
                user=user,
                vocabulary=vocabulary,
                defaults={
                    'status': 'mastered',
                    'last_reviewed': timezone.now(),
                    'review_count': 1
                }
            )
            if not created and progress.status != 'mastered':
                progress.status = 'mastered'
                progress.last_reviewed = timezone.now()
                progress.save()

            # Tăng total_vocab_learned
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.total_vocab_learned += 1
            profile.save()

            # Kiểm tra danh hiệu dựa trên total_vocab_learned mới
            check_and_assign_achievements(profile)

# ------------------ SIGNAL: CẬP NHẬT TOTAL_VOCAB KHI FLASHCARD ITEM ĐƯỢC ĐÁNH DẤU ĐÃ NHỚ ------------------
@receiver(post_save, sender=FlashcardSetItem)
def update_total_vocab_on_memorized(sender, instance, created, **kwargs):
    """
    Khi một FlashcardSetItem được lưu và có memorized = True,
    đánh dấu từ vựng tương ứng là mastered (nếu chưa) và tăng total_vocab_learned.
    """
    if instance.memorized:
        # Xác định vocabulary từ instance
        vocab = None
        if instance.vocabulary:
            vocab = instance.vocabulary
        elif instance.saved_vocab:
            vocab = instance.saved_vocab.vocabulary

        if vocab:
            # Gọi hàm đánh dấu mastered
            mark_vocabulary_mastered(instance.flashcard_set.user, vocab)