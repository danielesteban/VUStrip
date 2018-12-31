#include <ArduinoOTA.h>
#include <ESPAsyncWebServer.h>
#include <FastLED.h>

#define NUM_LEDS 40
#define DATA_PIN 0
#define BUTTON_PIN 2

#define BRIGHTNESS 96
#define FRAMES_PER_SECOND 120

struct {
  uint8_t left;
  uint8_t right;
} amplitude = {0, 0};
uint8_t button = HIGH;
bool enabled = true;
uint8_t hue = 0;
CRGB leds[NUM_LEDS];
AsyncWebServer server(80);
AsyncWebSocket ws("/");

void animate() {
  fadeToBlackBy(leds, NUM_LEDS, 40);
  if (enabled) {
    const int mid = NUM_LEDS / 2;
    {
      // Left channel
      const int to = map(amplitude.left, 0, 0xFF, 0, mid);
      const int from = max(to - (NUM_LEDS / 5), 0);
      for (int i = from; i < to; i++) {
        leds[mid + i] = CHSV((hue + (i - from) * 2) % 0xFF, 255, 192);
      }
    }
    {
      // Right channel
      const int to = map(amplitude.right, 0, 0xFF, 0, mid);
      const int from = max(to - (NUM_LEDS / 5), 0);
      for (int i = from; i < to; i++) {
        leds[mid - 1 - i] = CHSV((hue + 128 + (i - from) * 2) % 0xFF, 255, 192);
      }
    }
  }
  FastLED.show();
  FastLED.delay(1000 / FRAMES_PER_SECOND);
  EVERY_N_MILLISECONDS(20) {
    hue++;
  }
}

void onWsEvent(AsyncWebSocket* server, AsyncWebSocketClient* client, AwsEventType type, void* arg, uint8_t* data, size_t len) {
  if (type == WS_EVT_DATA && len == 2) {
    // Received amplitude from a client
    amplitude.left = data[0];
    amplitude.right = data[1];
  }
}

void processInput() {
  const uint8_t read = digitalRead(BUTTON_PIN);
  if (read != button) {
    button = read;
    if (button == LOW) {
      enabled = !enabled;
    }
  }
}

void loop() {
  ArduinoOTA.handle();
  processInput();
  animate();
}

void networkSetup() {
  // Generate SSID
  String ssid = "strip-";
  ssid += String(ESP.getChipId(), HEX);

  // Start access point with a fixed IP address
  WiFi.persistent(false);
  WiFi.mode(WIFI_AP);
  IPAddress address(192, 168, 1, 1);
  IPAddress gateway(192, 168, 1, 1);
  IPAddress subnet(255, 255, 255, 0);
  WiFi.softAPConfig(address, gateway, subnet);
  WiFi.softAP(ssid.c_str(), "security");

  // Form
  String form = (
    "<style>"
    "body{background:#111;color:#fff;text-align:center;margin:2rem;font-size:2rem}"
    "button,input,select{width:200px;margin:0.5rem 0 1rem;padding:1rem 2rem;font-size:inherit}"
    "</style>"
    "<form action=\"/\" method=\"post\">"
    "SSID:<br />"
    "<select name=\"ssid\">"
  );
  const int count = WiFi.scanNetworks();
  for (int i = 0; i < count; i ++) {
    form += "<option>" + WiFi.SSID(i) + "</option>";
  }
  form += (
    "</select><br />"
    "Password:<br />"
    "<input type=\"password\" name=\"password\" /><br />"
    "<button type=\"submit\">Submit</button>"
    "</form>"
  );
  server.on("/", HTTP_GET, [form](AsyncWebServerRequest* request) {
    request->send(200, "text/html", form);
  });

  // Endpoint
  server.on("/", HTTP_POST, [](AsyncWebServerRequest* request) {
    String ssid;
    String password;
    for (uint8_t i = 0; i < request->args(); i++) {
      if (request->argName(i).equals("ssid")) {
        ssid = request->arg(i);
      } else if (request->argName(i).equals("password")) {
        password = request->arg(i);
      }
    }
    if (ssid.length() && password.length()) {
      request->send(200, "text/plain", "OK. Restarting...");
      WiFi.persistent(true);
      WiFi.mode(WIFI_STA);
      WiFi.setSleepMode(WIFI_NONE_SLEEP);
      WiFi.setPhyMode(WIFI_PHY_MODE_11N);
      WiFi.begin(ssid.c_str(), password.c_str());
      ESP.restart();
    } else {
      request->send(200, "text/plain", "FAIL.");
    }
  });

  // Start the server
  server.begin();
}

void setup() {
  // Init I/O
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  FastLED.addLeds<NEOPIXEL, DATA_PIN>(leds, NUM_LEDS);
  FastLED.setBrightness(BRIGHTNESS);
  FastLED.clear(true);

  // Handle 404s
  server.onNotFound([](AsyncWebServerRequest* request) {
    request->send(404);
  });

  // Wait for connection
  uint8_t result = WiFi.waitForConnectResult();

  // Setup network config server if requested/unconfigured
  if (digitalRead(BUTTON_PIN) == LOW || WiFi.getMode() != WIFI_STA) {
    networkSetup();
    return;
  }

  // Connection failed.. Delay and restart
  if (result != WL_CONNECTED) {
    delay(5000);
    ESP.restart();
    return;
  }

  // Setup OTA updates
  ArduinoOTA.setPassword("security");
  ArduinoOTA.onStart([]() {
    FastLED.clear(true);
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    const unsigned int scaled = (progress / (total / NUM_LEDS));
    if (scaled >= NUM_LEDS) {
      FastLED.clear(true);
    } else {
      for (unsigned int i = 0; i <= scaled; i ++) {
        leds[NUM_LEDS - 1 - i] = CHSV(hue + i * 2, 255, 192);
      }
      FastLED.show();
      hue++;
    }
  });
  ArduinoOTA.begin();

  // Start the server
  ws.onEvent(onWsEvent);
  server.addHandler(&ws);
  server.begin();
}
