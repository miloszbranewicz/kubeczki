# Generator Konstrukcji z Kubeczków

Aplikacja do projektowania i wizualizacji różnorodnych konstrukcji z kubeczków.

## Funkcje

- Inteligentny system układania kubeczków w formie piramid lub stosów
- Automatyczne rozpoznawanie zamierzonego typu konstrukcji
- Wyrównywanie do siatki zapewniające idealnie równe rozmieszczenie kubeczków
- Wizualna siatka pomocnicza ułatwiająca precyzyjne umieszczanie kubeczków
- Zaawansowana analiza wzorców konstrukcji dla lepszego rozpoznawania intencji użytkownika
- Adaptacyjne zachowanie dopasowujące nowe kubeczki do istniejących struktur
- Różne kolory kubeczków do wyboru
- Eksport projektu do PDF
- Testowanie automatyczne poprzez wbudowane funkcje

## Instrukcja użytkowania

### Obsługa interfejsu
1. Wybierz rozmiar siatki z rozwijanej listy
2. Kliknij na kolor kubeczka, który chcesz użyć
3. Kliknij na siatkę, aby umieścić kubeczek
4. Kliknij prawym przyciskiem myszy na kubeczek, aby go usunąć
5. Użyj przycisku "Eksportuj do PDF", aby zapisać swój projekt

### Budowanie konstrukcji
Aplikacja automatycznie rozpoznaje zamierzony typ konstrukcji:

#### Piramidy
- Kliknij między dwoma kubeczkami, aby umieścić nowy kubeczek na środku nad nimi
- Kubeczki w piramidzie są ustawiane naprzemiennie wierzchołkiem w górę i w dół
- Aplikacja automatycznie wykrywa wymagane wsparcie i umieszcza kubeczek w odpowiednim miejscu
- System analizuje istniejące wzorce piramid, aby zachować spójność konstrukcji

#### Stosy
- Kliknij nad kubeczkiem, aby postawić na nim kolejny kubeczek
- Kubeczki w stosie są ustawiane naprzemiennie wierzchołkiem w górę i w dół
- Aplikacja automatycznie wykrywa kubeczek pod spodem i umieszcza nowy kubeczek dokładnie nad nim
- System analizuje istniejące stosy, aby utrzymać spójność konstrukcji w pionie

#### Konstrukcje podstawowe
- Kliknij w dowolnym pustym miejscu, aby umieścić pierwszy kubeczek
- Kubeczki są automatycznie przyciągane do najbliższego punktu siatki
- Buduj kolejne elementy konstrukcji, korzystając z trybu piramidy lub stosu
- System analizuje kontekst i okoliczne kubeczki, aby lepiej zrozumieć zamierzoną strukturę

### System wyrównywania do siatki
- Aplikacja wyświetla wizualną siatkę pomocniczą
- Wszystkie kubeczki są automatycznie przyciągane do punktów siatki
- Zapewnia idealne wyrównanie wszystkich elementów konstrukcji
- Siatka jest ukrywana w eksportowanym pliku PDF

### Zaawansowane rozpoznawanie wzorców
- System analizuje istniejące układy kubeczków, aby wykryć wzorce piramid i stosów
- Na podstawie analizy kontekstu i probabilistycznego podejścia, aplikacja lepiej rozpoznaje intencje użytkownika
- Kubeczki są automatycznie ustawiane w odpowiednim kierunku (wierzchołkiem w górę lub w dół) w zależności od typu konstrukcji
- Aplikacja dostosowuje położenie nowych kubeczków do istniejących wzorców, zachowując spójność konstrukcji

### Testowanie
Aplikacja zawiera funkcje testowe dostępne w konsoli przeglądarki:
- `testPyramid()` - buduje przykładową piramidę
- `testRectangle()` - buduje przykładowy prostokąt bez odstępów
- `testRectangleWithGap()` - buduje przykładowy prostokąt z odstępami

## Wymagania techniczne
- Nowoczesna przeglądarka internetowa z obsługą JavaScript
- Zalecana rozdzielczość ekranu min. 1024x768

## Zasady fizycznego układania kubeczków
- W piramidzie każdy kubeczek wyższej warstwy musi być wsparty przez dwa kubeczki niższej warstwy
- W stosie kubeczki są układane jeden na drugim
- Zwróć uwagę na kierunek kubeczków (wierzchołkiem w górę lub w dół)
- Dla estetycznego wyglądu, warto zachować równe odstępy między kubeczkami

## Technologie

- HTML5
- CSS3
- JavaScript
- [Konva.js](https://konvajs.org/) - do obsługi interaktywnego canvas
- [jsPDF](https://github.com/parallax/jsPDF) - do generowania plików PDF

## Jak uruchomić

1. Sklonuj to repozytorium na swój komputer
2. Otwórz plik `index.html` w przeglądarce internetowej
3. Alternatywnie, możesz użyć serwera lokalnego (np. Live Server w Visual Studio Code)

## Autor

Generator Konstrukcji z Kubeczków został stworzony zgodnie z wymaganiami określonymi w pliku `.req.md`.

## Licencja

Ten projekt jest udostępniany na licencji [MIT](https://opensource.org/licenses/MIT). 