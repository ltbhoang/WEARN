from django.contrib import admin
from .models import Collection, Vocabulary, LearningProgress, SavedVocabulary

# Đăng ký các model để chúng hiện lên giao diện Admin
admin.site.register(Collection)
admin.site.register(Vocabulary)
admin.site.register(LearningProgress)
admin.site.register(SavedVocabulary)
