# Generator Piramid z Kubeczków

Interaktywna aplikacja webowa do projektowania piramid z kubeczków. Aplikacja umożliwia użytkownikom tworzenie własnych projektów piramid, które można następnie eksportować do pliku PDF i odtworzyć fizycznie za pomocą kolorowych kubeczków.

## Funkcje

- Projektowanie piramid z kubeczków w różnych rozmiarach siatki (10x10, 12x12, 14x14, 16x16, 18x18, 20x20)
- Wybór z 11 kolorów kubeczków
- Interaktywne umieszczanie kubeczków zgodnie z zasadami fizyki
- Eksport projektu do pliku PDF
- Intuicyjny interfejs użytkownika w języku polskim

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

## Instrukcja użycia

1. Wybierz rozmiar siatki z listy rozwijanej
2. Wybierz kolor kubeczka z paska narzędzi
3. Kliknij na siatkę, aby umieścić kubeczek
4. Pamiętaj, że kubeczki muszą być ustawiane zgodnie z zasadami fizyki:
   - Kubeczki w sąsiednich rzędach muszą być ustawiane na przemian
   - Każdy kubeczek z wyższej warstwy musi być podparty przez dwa kubeczki niższej warstwy
   - Kubeczki wyższej warstwy nie mogą być szersze niż warstwy poniżej
5. Kliknij prawym przyciskiem myszy, aby usunąć kubeczek
6. Użyj przycisku "Eksportuj do PDF", aby zapisać projekt

## Zasady fizycznego układania

- Kubeczki w sąsiednich rzędach muszą być ustawiane na przemian (wzór szachownicy)
- Każdy kubeczek z wyższej warstwy musi być odwrócony w stosunku do kubeczka poniżej
- Piramida nie może się rozszerzać (kubeczki wyższej warstwy nie mogą być szersze niż warstwy poniżej)
- Klasyczny wzór piramidy to np. 4-3-2-1, ale możesz tworzyć dowolne konfiguracje zgodne z regułami fizyki

## Autor

Generator Piramid z Kubeczków został stworzony zgodnie z wymaganiami określonymi w pliku `.req.md`.

## Licencja

Ten projekt jest udostępniany na licencji [MIT](https://opensource.org/licenses/MIT). 