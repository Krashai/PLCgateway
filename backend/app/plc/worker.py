import time
import threading
import asyncio
import snap7
import paho.mqtt.client as mqtt
from app.core.models import PLCConfig
from app.plc.utils import decode_tag_value
from app.api.websocket import manager as ws_manager

class PLCWorker(threading.Thread):
    def __init__(self, config: PLCConfig, mqtt_client: mqtt.Client, loop: asyncio.AbstractEventLoop, poll_rate: float = 1.0):
        super().__init__(daemon=True)
        self.config = config
        self.mqtt_client = mqtt_client
        self.loop = loop
        self.poll_rate = poll_rate
        self.running = True
        self.client = snap7.client.Client()
        self.last_values = {}  # Cache dla mechanizmu publish-on-change

    def connect(self):
        """Próba połączenia ze sterownikiem PLC."""
        if not self.client.get_connected():
            try:
                # Jeśli łączymy się z localhost, używamy portu 1102 (nasz mock)
                if self.config.ip == "127.0.0.1":
                    self.client.set_param(snap7.types.RemotePort, 1102)
                else:
                    self.client.set_param(snap7.types.RemotePort, 102)
                
                print(f"DEBUG: Proba polaczenia z IP={self.config.ip}, Rack={self.config.rack}, Slot={self.config.slot}", flush=True)
                self.client.connect(self.config.ip, self.config.rack, self.config.slot)
                self.config.online = True
                print(f"SUCCESS: Polaczono z {self.config.ip}", flush=True)
            except Exception as e:
                print(f"ERROR: Brak polaczenia z {self.config.ip}: {e}", flush=True)
                self.config.online = False
                return False
        return True

    def run(self):
        """Główna pętla odczytu PLC."""
        while self.running:
            start_time = time.time()
            if self.connect():
                try:
                    dbs = {}
                    for tag in self.config.tags:
                        if tag.db not in dbs: dbs[tag.db] = []
                        dbs[tag.db].append(tag)

                    for db_num, tags in dbs.items():
                        max_offset = max(t.offset for t in tags) + 4
                        raw_data = self.client.db_read(db_num, 0, max_offset)

                        for tag in tags:
                            bit_val = getattr(tag, 'bit', 0)
                            val = decode_tag_value(raw_data, tag.offset, tag.type, bit_val)
                            if val is not None:
                                # Mechanizm publish-on-change
                                if val != self.last_values.get(tag.name):
                                    tag.value = val
                                    self.publish_to_mqtt(tag)
                                    self.last_values[tag.name] = val
                                else:
                                    tag.value = val
                    
                    self.config.online = True
                except Exception as e:
                    print(f"ERROR: Wyjątek podczas odczytu {self.config.ip}: {e}", flush=True)
                    self.config.online = False
                    self.client.disconnect()
            
            # Informujemy WebSocket o aktualnym stanie całego sterownika
            self.broadcast_update()
            
            # Dynamiczne dopasowanie czasu snu, aby utrzymać poll_rate
            elapsed = time.time() - start_time
            sleep_time = max(0, self.poll_rate - elapsed)
            time.sleep(sleep_time)

    def publish_to_mqtt(self, tag):
        topic = f"lines/{self.config.id}/{tag.name}"
        self.mqtt_client.publish(topic, str(tag.value))

    def broadcast_update(self):
        """Wysyła stan sterownika przez WebSockets (bezpiecznie z wątku)."""
        data = {
            "type": "PLC_UPDATE",
            "payload": self.config.model_dump()
        }
        # Przekazujemy wiadomość asynchronicznie do głównej pętli
        asyncio.run_coroutine_threadsafe(ws_manager.broadcast(data), self.loop)

    def stop(self):
        self.running = False
        if self.client.get_connected():
            self.client.disconnect()
