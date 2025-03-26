# Generator Układów Kubeczków

Aplikacja oparta na canvas pozwalająca użytkownikom tworzyć, edytować i eksportować układy kubeczków.

## Funkcje

- Tworzenie układów kubeczków na siatkach o różnych rozmiarach (10x10, 12x12, 14x14, 16x16, 18x18, 20x20)
- Umieszczanie kubeczków w pozycji normalnej lub odwróconej
- Edycja pozycji i orientacji kubeczków
- Usuwanie kubeczków
- Czyszczenie całej planszy jednym kliknięciem
- Wizualne informacje zwrotne z kolorowym podświetleniem pozycji
- Wybór i odznaczanie kubeczków prawym przyciskiem myszy
- Eksport układów do PDF (wkrótce)
- Ograniczenia fizyczne zapewniające, że układy są fizycznie możliwe do zbudowania

## Instrukcja użytkowania

1. Wybierz rozmiar siatki z rozwijanego menu
2. Kliknij na siatkę, aby umieścić kubek
   - Kubki w dolnym rzędzie można umieszczać dowolnie
   - Kubki w wyższych rzędach muszą przestrzegać zasad fizyki
   - Zielone podświetlenia wskazują prawidłowe pozycje
   - Czerwone podświetlenia wskazują nieprawidłowe pozycje
3. Kliknij prawym przyciskiem myszy na kubek, aby go wybrać (kliknij ponownie prawym przyciskiem, aby odznaczyć)
4. Użyj przycisku "Zmień orientację kubka", aby zmienić orientację kubka
5. Użyj przycisku "Usuń wybrany kubek", aby usunąć wybrany kubek
6. Użyj przycisku "Wyczyść planszę", aby usunąć wszystkie kubki
7. Użyj przycisku "Eksportuj do PDF", aby wyeksportować swój układ (wkrótce)

## Ograniczenia fizyczne

Aplikacja wymusza następujące ograniczenia fizyczne:
- Kubek umieszczony bezpośrednio na innym kubku musi mieć przeciwną orientację
- Kubki nie mogą być umieszczane w powietrzu (muszą mieć podparcie z kubków poniżej)
- Kubek w pozycji połówkowej musi mieć podparcie z kubków po obu stronach poniżej
- Wspiera struktury piramidowe, gdzie wyższe warstwy mogą mieć mniej kubków niż niższe warstwy
- Umożliwia tworzenie stabilnych układów, takich jak układy kubków 4-3-2-1

## Rozwój

Ta aplikacja wykorzystuje czysty JavaScript z HTML5 Canvas do renderowania. Nie wymaga zewnętrznych bibliotek.

### Przyszłe ulepszenia

- Wsparcie dla różnych kolorów kubków
- Możliwość zapisywania i wczytywania układów
- Funkcja eksportu do PDF
- Ulepszony wygląd
- Interfejs przeciągnij i upuść
- Funkcja cofnij/ponów 