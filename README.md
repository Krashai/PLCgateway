# PLC Gateway for Siemens S7

Nowoczesny, lekki i skalowalny gateway do odczytu danych ze sterowników Siemens PLC (S7-300, S7-1200, S7-1500) z interfejsem webowym i publikacją danych przez MQTT.

## 🚀 Kluczowe Funkcje
- **Obsługa wielu PLC:** Równoległy odczyt z ok. 30 sterowników dzięki architekturze wielowątkowej.
- **Interfejs Webowy:** Nowoczesny dashboard w React do konfiguracji (CRUD) i podglądu danych "live".
- **Dynamiczna Konfiguracja:** Dodawanie sterowników i definiowanie zmiennych (DB) bez restartu aplikacji.
- **Dystrybucja danych:** Publikacja wartości w czasie rzeczywistym do brokera MQTT (IIoT Ready).
- **Bezpieczeństwo:** System logowania oparty na JWT (JSON Web Tokens).
- **Docker-First:** Całość uruchamiana jednym poleceniem przy użyciu Docker Compose.

## 🛠️ Stack Technologiczny
- **Backend:** Python 3.11, FastAPI (REST & WebSockets), `python-snap7`.
- **Frontend:** React + Vite, TailwindCSS, Lucide Icons.
- **Broker MQTT:** Eclipse Mosquitto.
- **Przechowywanie danych:** JSON (Konfiguracja), In-Memory (Aktualne stany).
- **Orkiestracja:** Docker & Docker Compose.

## 🏗️ Architektura Systemu
System składa się z trzech głównych komponentów:
1. **Core Gateway (Python):** Zarządza pulą wątków (jeden per PLC). Każdy wątek odpytuje sterownik co 1 sekundę i przekazuje dane do magistrali wewnętrznej.
2. **API Layer (FastAPI):** Obsługuje żądania z Frontendu oraz rozsyła dane przez WebSockets do aktywnych użytkowników.
3. **Frontend (React):** SPA serwowane przez Nginx, pozwalające na zarządzanie infrastrukturą PLC.

### Przepływ danych (Data Flow)
`PLC (S7 Protocol)` -> `Python Worker` -> `Internal Bus` -> `MQTT Publish`
                                     -> `WebSockets` -> `React UI`

## 📂 Struktura Konfiguracji (config.json)
Konfiguracja sterowników i zmiennych jest przechowywana w prostym formacie JSON:
```json
{
  "plcs": [
    {
      "id": "plc_1",
      "name": "Linia Pakowania",
      "ip": "192.168.1.10",
      "rack": 0,
      "slot": 1,
      "type": "S7-1200",
      "tags": [
        {"name": "Temperatura", "db": 10, "offset": 0, "type": "REAL"},
        {"name": "Licznik_Sztuk", "db": 10, "offset": 4, "type": "DINT"}
      ]
    }
  ]
}
```

## 📡 Schemat MQTT
Dane są publikowane na następujących tematach:
- `gateway/status/{plc_id}` - `online` / `offline`
- `gateway/data/{plc_id}/{tag_name}` - wartość zmiennej (np. `23.5`)

## 🛠️ Uruchomienie
Wymagany zainstalowany Docker i Docker Compose.
```bash
docker-compose up -d
```
Interfejs będzie dostępny pod adresem: `http://localhost:3000`

## 📝 Roadmap
- [ ] Implementacja mechanizmu Multi-threading dla 30+ PLC.
- [ ] Dashboard z automatycznym odświeżaniem (WebSockets).
- [ ] System autoryzacji użytkowników.
- [ ] Obsługa typów danych: BOOL, INT, REAL, DINT.
- [ ] Eksport/Import konfiguracji JSON z poziomu UI.
