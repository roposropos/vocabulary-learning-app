from django.contrib import admin

from .models import Question, Quiz, UserQuizResult, UserWordProgress, Word, WordSet

admin.site.register(WordSet)
admin.site.register(Word)
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(UserWordProgress)
admin.site.register(UserQuizResult)
