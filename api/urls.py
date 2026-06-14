from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'), # Rejestracja
    path('login/', views.login_user, name='login'),         # Logowanie
    path("sets/", views.get_sets),                       # lista wszystkich zestawów
    path("sets/create/", views.create_set),              # 1 tworzenie zestawu
    path("sets/<int:set_id>/", views.get_set),          # pobranie jednego zestawu
    path("sets/<int:set_id>/delete/", views.delete_set), # usuwanie zestawu
    path("sets/<int:set_id>/flashcards/", views.flashcards), # flashcards
    path("sets/<int:set_id>/add_word/", views.add_word),     # dodawanie słówka
    path("words/<int:word_id>/delete/", views.delete_word),  # 2 usuwanie słówka
    path("words/<int:word_id>/edit/", views.edit_word),      # edytowanie słówka
    path("sets/<int:set_id>/import/", views.import_words),   # import słówek z pliku
    path("words/<int:word_id>/check/", views.check_word_answer), # sprawdzanie odpowiedzi wpisywanej
    path("words/<int:word_id>/toggle-hard/", views.toggle_hard_word), # oznaczenie slowka jako trudne
    path("words/<int:word_id>/flashcard-progress/", views.update_flashcard_progress), # opanowane / do powtorki
    path("sets/<int:set_id>/quiz/", views.create_quiz),      # tworzenie quizu
    path("sets/<int:set_id>/review/", views.get_review_flashcards), # słówka trudne
    path("sets/<int:set_id>/stats/", views.get_set_stats),  # statystki quizu
    path("quizzes/<int:quiz_id>/", views.get_quiz),         # pobranie quizu
    path("quizzes/<int:quiz_id>/submit/", views.submit_quiz), # wynik quizu
    path("quiz/<int:quiz_id>/submit/", views.submit_quiz),    # zgodność z etap2b
]
