from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'  # thêm dòng này nếu chưa có
    name = 'api'

    def ready(self):
        import api.signals  # import signal để đăng ký
