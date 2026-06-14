from django.db import models
from django.contrib.auth.models import User

class WordSet(models.Model):
    name = models.CharField(max_length=100)
    public = models.BooleanField(default=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="word_sets")

    def __str__(self):
        return self.name

class Word(models.Model):
    word_set = models.ForeignKey(WordSet, related_name="words", on_delete=models.CASCADE)
    pl = models.CharField(max_length=100)
    en = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.pl} - {self.en}"

class Quiz(models.Model):
    name = models.CharField(max_length=100)
    word_set = models.ForeignKey(WordSet, related_name="quizzes", on_delete=models.CASCADE)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="quizzes")
    public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name="questions", on_delete=models.CASCADE)
    word = models.ForeignKey(Word, on_delete=models.CASCADE)
    option1 = models.CharField(max_length=100)
    option2 = models.CharField(max_length=100)
    option3 = models.CharField(max_length=100)
    option4 = models.CharField(max_length=100)
    correct_option = models.IntegerField()  # numer 1-4

    def __str__(self):
        return f"Question: {self.word.pl}"

class UserWordProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="word_progress")
    word = models.ForeignKey(Word, on_delete=models.CASCADE, related_name="progress")
    correct_answers = models.IntegerField(default=0)
    incorrect_answers = models.IntegerField(default=0)
    is_hard = models.BooleanField(default=False)
    is_mastered = models.BooleanField(default=False)
    needs_review = models.BooleanField(default=False)
    class Meta:
        unique_together = ('user', 'word')
    def __str__(self):
        return f"Progress {self.user.username} for word: {self.word.pl}"


class UserQuizResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="quiz_results")
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="results")
    word_set = models.ForeignKey(WordSet, on_delete=models.CASCADE, related_name="quiz_results")
    correct_count = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    score_percentage = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.quiz.name} ({self.score_percentage}%)"
