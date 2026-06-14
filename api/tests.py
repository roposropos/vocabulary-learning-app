import json

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Word, WordSet


class FrontendPageTests(TestCase):
    def test_homepage_loads(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Najpierw konto, potem nauka.")

    def test_how_it_works_route_loads(self):
        response = self.client.get("/how-it-works")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Powtarzaj karta po karcie")


class AuthAndSetFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_returns_token(self):
        response = self.client.post(
            "/api/register/",
            {"username": "ania", "password": "bezpieczne123"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["username"], "ania")

    def test_create_set_with_token_auth(self):
        user = User.objects.create_user(username="jan", password="tajne123")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(
            "/api/sets/create/",
            {"name": "Francuski A1", "public": False},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(WordSet.objects.count(), 1)
        created_set = WordSet.objects.get()
        self.assertEqual(created_set.owner, user)
        self.assertFalse(created_set.public)
        self.assertEqual(response.data["set"]["name"], "Francuski A1")

    def test_create_set_with_starter_words(self):
        user = User.objects.create_user(username="marta", password="tajne123")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(
            "/api/sets/create/",
            {
                "name": "Włoski start",
                "public": True,
                "words": [
                    {"pl": "dom", "en": "house"},
                    {"pl": "miasto", "en": "city"},
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        created_set = WordSet.objects.get(name="Włoski start")
        self.assertEqual(created_set.words.count(), 2)
        self.assertEqual(response.data["set"]["words"][0]["pl"], "dom")

    def test_add_word_to_created_set(self):
        user = User.objects.create_user(username="ola", password="tajne123")
        token = Token.objects.create(user=user)
        word_set = WordSet.objects.create(name="Podróże", public=True, owner=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(
            f"/api/sets/{word_set.id}/add_word/",
            {"pl": "lotnisko", "en": "airport"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Word.objects.count(), 1)
        self.assertEqual(response.data["word"]["pl"], "lotnisko")

    def test_import_words_from_csv(self):
        user = User.objects.create_user(username="adam", password="tajne123")
        token = Token.objects.create(user=user)
        word_set = WordSet.objects.create(name="Import CSV", public=True, owner=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        upload = SimpleUploadedFile(
            "slowa.csv",
            "pl,en\ndom,house\npies,dog\n".encode("utf-8"),
            content_type="text/csv",
        )

        response = self.client.post(f"/api/sets/{word_set.id}/import/", {"file": upload})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(word_set.words.count(), 2)
        self.assertEqual(response.data["message"], "Zaimportowano 2 słówek.")

    def test_import_words_from_json(self):
        user = User.objects.create_user(username="kasia", password="tajne123")
        token = Token.objects.create(user=user)
        word_set = WordSet.objects.create(name="Import JSON", public=True, owner=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        upload = SimpleUploadedFile(
            "slowa.json",
            json.dumps([
                {"pl": "kot", "en": "cat"},
                {"pl": "koń", "en": "horse"},
            ]).encode("utf-8"),
            content_type="application/json",
        )

        response = self.client.post(f"/api/sets/{word_set.id}/import/", {"file": upload})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(word_set.words.count(), 2)

    def test_check_word_answer(self):
        user = User.objects.create_user(username="ewa", password="tajne123")
        token = Token.objects.create(user=user)
        word_set = WordSet.objects.create(name="Ćwiczenia", public=True, owner=user)
        word = Word.objects.create(word_set=word_set, pl="pies", en="dog")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(
            f"/api/words/{word.id}/check/",
            {"answer": " DOG "},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["correct"])
        self.assertEqual(response.data["correct_answer"], "dog")

    def test_flashcards_and_quiz_flow(self):
        user = User.objects.create_user(username="ewa", password="tajne123")
        token = Token.objects.create(user=user)
        word_set = WordSet.objects.create(name="Zwierzęta", public=True, owner=user)
        Word.objects.create(word_set=word_set, pl="pies", en="dog")
        Word.objects.create(word_set=word_set, pl="kot", en="cat")
        Word.objects.create(word_set=word_set, pl="ptak", en="bird")
        Word.objects.create(word_set=word_set, pl="koń", en="horse")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        flashcards = self.client.get(f"/api/sets/{word_set.id}/flashcards/")
        self.assertEqual(flashcards.status_code, 200)
        self.assertEqual(len(flashcards.data), 4)

        created_quiz = self.client.post(
            f"/api/sets/{word_set.id}/quiz/",
            {"name": "Quiz zwierzęta"},
            format="json",
        )
        self.assertEqual(created_quiz.status_code, 200)
        self.assertIn("quiz_id", created_quiz.data)

        fetched_quiz = self.client.get(f"/api/quizzes/{created_quiz.data['quiz_id']}/")
        self.assertEqual(fetched_quiz.status_code, 200)
        self.assertEqual(fetched_quiz.data["quiz"]["name"], "Quiz zwierzęta")
        self.assertEqual(len(fetched_quiz.data["questions"]), 4)

        answers = {
            str(question["id"]): question["correct_option"]
            for question in fetched_quiz.data["questions"]
        }
        submitted = self.client.post(
            f"/api/quizzes/{created_quiz.data['quiz_id']}/submit/",
            {"answers": answers},
            format="json",
        )

        self.assertEqual(submitted.status_code, 200)
        self.assertEqual(submitted.data["correct_count"], 4)
        self.assertEqual(submitted.data["score_percentage"], 100.0)

    def test_edit_word_in_set(self):
        user = User.objects.create_user(username="tomek", password="tajne123")
        token = Token.objects.create(user=user)
        word_set = WordSet.objects.create(name="Zestaw testowy", public=True, owner=user)

        word = Word.objects.create(word_set=word_set, pl="komputer", en="camputer")
        
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(
            f"/api/words/{word.id}/edit/",
            {"pl": "komputer", "en": "computer"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        
        word.refresh_from_db()
        self.assertEqual(word.en, "computer")
        self.assertEqual(response.data["message"], "Słówko zostało zaktualizowane")
