# Vocabulary Learning App

Academic group project prepared as part of a university course. The application helps users learn vocabulary by creating word sets, practicing with flashcards, checking typed answers, generating quizzes and tracking learning progress.

The goal of the project was to build a simple full-stack web application with user accounts, a REST API, local data persistence and an interactive browser interface for vocabulary practice.

## Features

- user registration and login with token-based authentication;
- creation of public and private vocabulary sets;
- manual adding, editing and deleting of word pairs;
- importing vocabulary from CSV and JSON files;
- flashcard learning mode with card flipping and progress marking;
- typed-answer practice with automatic answer checking;
- automatic multiple-choice quiz generation from selected word sets;
- saving quiz results and calculating learning statistics;
- marking difficult words and collecting words for later review;
- basic ownership and access control for private sets.

## Architecture

| Component | Responsibility |
| --- | --- |
| `vocabapp` | Stores the main Django project configuration, global URLs, ASGI and WSGI entry points. |
| `api.models` | Defines vocabulary sets, words, quizzes, questions, word progress and quiz results. |
| `api.views` | Handles API requests, authentication, set management, imports, quiz generation and progress updates. |
| `api.urls` | Exposes the REST endpoints used by the frontend. |
| `api.templates` | Contains the main HTML template rendered by Django. |
| `api.static` | Contains the CSS and JavaScript responsible for the browser interface. |
| `api.tests` | Contains tests for the main view, authentication, set creation, imports, flashcards and quiz flow. |

## Data Model

| Model | Responsibility |
| --- | --- |
| `WordSet` | Represents a vocabulary set owned by a user. A set can be public or private. |
| `Word` | Represents a single Polish-English word pair assigned to a set. |
| `Quiz` | Represents a quiz generated from a selected vocabulary set. |
| `Question` | Stores one multiple-choice question with four options and the correct answer index. |
| `UserWordProgress` | Stores individual progress for a given user and word. |
| `UserQuizResult` | Stores quiz score, number of correct answers and percentage result. |

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/register/` | Creates a user account and returns an authentication token. |
| `POST` | `/api/login/` | Authenticates a user and returns an authentication token. |
| `GET` | `/api/sets/` | Returns public sets and sets owned by the logged-in user. |
| `POST` | `/api/sets/create/` | Creates a new vocabulary set. |
| `GET` | `/api/sets/<set_id>/` | Returns a selected set with its words. |
| `POST` | `/api/sets/<set_id>/add_word/` | Adds a word to a user-owned set. |
| `POST` | `/api/sets/<set_id>/import/` | Imports words from a CSV or JSON file. |
| `GET` | `/api/sets/<set_id>/flashcards/` | Returns flashcards for a selected set. |
| `POST` | `/api/words/<word_id>/check/` | Checks a typed answer and updates progress. |
| `POST` | `/api/words/<word_id>/toggle-hard/` | Marks or unmarks a word as difficult. |
| `POST` | `/api/words/<word_id>/flashcard-progress/` | Saves flashcard progress as mastered or requiring review. |
| `POST` | `/api/sets/<set_id>/quiz/` | Generates a quiz from the selected set. |
| `GET` | `/api/quizzes/<quiz_id>/` | Returns quiz questions. |
| `POST` | `/api/quizzes/<quiz_id>/submit/` | Submits quiz answers and saves the result. |
| `GET` | `/api/sets/<set_id>/review/` | Returns words marked for review. |
| `GET` | `/api/sets/<set_id>/stats/` | Returns progress and quiz statistics for a set. |

Protected endpoints require the token returned during login or registration.

```http
Authorization: Token <token>
```

## Technologies

| Layer | Technologies |
| --- | --- |
| Backend | Python, Django, Django REST Framework |
| Authentication | Django Auth, DRF Token Authentication |
| Database | SQLite |
| Frontend | HTML, CSS, Vanilla JavaScript, Django Templates |
| Testing | Django TestCase, DRF APIClient |

## Project Structure

```text
.
├── api/
│   ├── migrations/          # database migrations
│   ├── static/api/          # frontend CSS and JavaScript
│   ├── templates/api/       # main application template
│   ├── admin.py             # Django admin configuration
│   ├── models.py            # application data models
│   ├── tests.py             # automated tests
│   ├── urls.py              # API route definitions
│   └── views.py             # API and view logic
├── vocabapp/
│   ├── settings.py          # Django settings
│   ├── urls.py              # main routing configuration
│   ├── asgi.py
│   └── wsgi.py
├── .env.example             # example environment configuration
├── .gitattributes           # repository text normalization
├── .gitignore               # ignored local and generated files
├── manage.py
├── requirements.txt
└── test.csv                 # example vocabulary import file
```

## Running Locally

Clone the repository and enter the project directory.

```bash
git clone <repository-url>
cd vocabulary-learning-app
```

Create and activate a virtual environment.

```bash
python -m venv venv
```

Windows:

```powershell
venv\Scripts\activate
```

macOS / Linux:

```bash
source venv/bin/activate
```

Install dependencies.

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Apply database migrations.

```bash
python manage.py migrate
```

Start the development server.

```bash
python manage.py runserver
```

The application will be available at:

```text
http://127.0.0.1:8000/
```

The API is available under:

```text
http://127.0.0.1:8000/api/
```

## Tests

```bash
python manage.py test
```

The test suite covers the main page, authentication, vocabulary set creation, word import, answer checking, flashcards and quiz submission flow.

## Import Format

CSV example:

```csv
pl,en
dom,house
pies,dog
kot,cat
```

JSON example:

```json
[
  { "pl": "dom", "en": "house" },
  { "pl": "pies", "en": "dog" },
  { "pl": "kot", "en": "cat" }
]
```

## Academic Context

This repository contains an academic group project prepared during university studies.

Project team:

| Name |
| --- |
| Robert Tworek |
| Piotr Smarż |
| Kuba Kowalski |
| Maciej Gołębiowski |
| Konrad Florczak |

## Repository Notes

The repository was prepared for GitHub publication. Local runtime files are intentionally excluded from version control, including the virtual environment, Python cache files, `.DS_Store` and the local SQLite database.
