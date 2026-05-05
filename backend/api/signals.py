from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Vocabulary, LearningProgress

@receiver(post_save, sender=User)
def create_user_learning_progress(sender, instance, created, **kwargs):
    """
    Khi một User mới được tạo (created=True), tự động tạo LearningProgress
    cho tất cả các từ vựng hiện có trong hệ thống.
    """
    if created:
        # Lấy tất cả từ vựng
        all_vocabs = Vocabulary.objects.all()
        
        # Tạo danh sách các đối tượng LearningProgress chưa lưu
        progress_list = [
            LearningProgress(
                user=instance,
                vocabulary=vocab,
                status='learning',
                review_count=0,
                last_reviewed=None  # hoặc timezone.now() nếu muốn
            )
            for vocab in all_vocabs
        ]
        
        # Bulk insert (chèn hàng loạt) để tối ưu hiệu năng
        # ignore_conflicts=True bỏ qua nếu đã tồn tại (tránh lỗi duplicate)
        LearningProgress.objects.bulk_create(progress_list, ignore_conflicts=True)