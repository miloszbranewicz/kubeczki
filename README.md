# Generator Konstrukcji z Kubeczków

Aplikacja do projektowania i wizualizacji różnorodnych konstrukcji z kubeczków.

## Funkcje

- Przeciąganie i upuszczanie kubeczków dla pełnej kontroli nad ich pozycjonowaniem
- Opcjonalne przyciąganie do siatki, które można włączyć lub wyłączyć
- Obracanie kubeczków po kliknięciu
- Wyrównywanie do siatki zapewniające idealnie równe rozmieszczenie kubeczków
- Wizualna siatka pomocnicza ułatwiająca precyzyjne umieszczanie kubeczków
- Ochrona przed kolizjami zapobiegająca nakładaniu się kubeczków
- Różne kolory kubeczków do wyboru
- Eksport projektu do PDF
- Testowanie automatyczne poprzez wbudowane funkcje

## Instrukcja użytkowania

### Obsługa interfejsu
1. Wybierz rozmiar siatki z rozwijanej listy
2. Kliknij na kolor kubeczka, który chcesz użyć
3. Kliknij na siatkę, aby umieścić kubeczek
4. Kliknij prawym przyciskiem myszy na kubeczek, aby go usunąć
5. Kliknij na istniejący kubeczek, aby go obrócić (zmienić kierunek wierzchołka)
6. Przeciągnij i upuść kubeczek, aby zmienić jego pozycję
7. Użyj opcji "Przyciągaj do siatki", aby włączyć lub wyłączyć automatyczne wyrównywanie
8. Użyj przycisku "Eksportuj do PDF", aby zapisać swój projekt

### Budowanie konstrukcji
Aplikacja oferuje pełną swobodę w projektowaniu konstrukcji:

#### Swobodne umieszczanie
- Umieszczaj kubeczki w dowolnym miejscu na planszy
- Przesuwaj kubeczki metodą przeciągnij i upuść
- Optymalizuj rozmieszczenie dzięki opcjonalnemu przyciąganiu do siatki
- Obrót kubeczków przez kliknięcie pozwala tworzyć różnorodne układy

#### Piramidy
- Układaj kubeczki w formie piramidy, jeden nad drugim
- Obroty kubeczków pozwalają tworzyć stabilne konstrukcje
- Używaj przyciągania do siatki dla idealnego wyrównania

#### Stosy
- Układaj kubeczki jeden na drugim
- Przesuwaj całe stosy, aby zmieniać układ
- Obracaj kubeczki, aby uzyskać naprzemienne ustawienie wierzchołkiem w górę i w dół

### System wyrównywania do siatki
- Aplikacja wyświetla wizualną siatkę pomocniczą
- Opcja przyciągania do siatki może być włączona lub wyłączona w dowolnym momencie
- Zapewnia idealne wyrównanie wszystkich elementów konstrukcji
- Siatka jest ukrywana w eksportowanym pliku PDF

### Przeciąganie i upuszczanie
- Kliknij i przytrzymaj kubeczek, aby rozpocząć przeciąganie
- Przesuń kubeczek w dowolne miejsce na planszy
- Puść przycisk myszy, aby upuścić kubeczek w nowej pozycji
- Z włączonym przyciąganiem do siatki, kubeczek zostanie automatycznie wyrównany do najbliższego punktu siatki

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
- Aby konstrukcja była stabilna, kubeczki nie powinny na siebie nachodzić

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