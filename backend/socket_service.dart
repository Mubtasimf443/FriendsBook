import 'package:friends_book/app/api_manager/api_url.dart';
import 'package:get/get.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'auth_service.dart';

class SocketService extends GetxService {
  static SocketService get to => Get.find<SocketService>();

  IO.Socket? _socket;
  final RxBool isConnected = false.obs;
  final RxString connectionId = ''.obs;

  final Map<String, Function(dynamic)> _listeners =
      {}; // For managing listeners

  Future<void> init() async {
   
  //  Get.log('Initializing SocketService with headers: $socketHeader');

    if (_socket != null && _socket!.connected) {
      Get.log('Already connected with ID: ${_socket!.id}');
      _updateConnectionStatus(true);
      return;
    }

    // Disconnect existing socket if any
    _cleanupSocket();
    var token = Get.find<AuthService>().apiToken;
    Get.log('Connecting to socket with token: $token');
    _socket = IO.io(
      'https://friendsbook-admin.onrender.com/socket/chat-messaging',
      IO.OptionBuilder()
          .setTransports(['polling', 'websocket'])
          .enableAutoConnect()
          .setExtraHeaders({'Authorization': 'video_calling_members:$token'})
          .setReconnectionAttempts(5)
          .setReconnectionDelay(1000)
          .build(),
    );

    _socket!.on('connect', (_) {
      _updateConnectionStatus(true);
      Get.log('✅ Connected with ID: ${_socket!.id}');
    });

    _socket!.on('disconnect', (_) {
      _updateConnectionStatus(false);
      Get.log('❌ Disconnected from server');
    });

    _socket!.on('connect_error', (err) {
      Get.log('⚠️ Socket connect_error: $err');
    });

    _socket!.on('error', (err) {
      Get.log('🚨 Socket error: $err');
    });
  }

  void emitEvent(String event, dynamic data) {
    if (_socket?.connected ?? false) {
      Get.log('[SOCKET] ➜ Emitting event: $event');
      _socket!.emit(event, data);
    } else {
      Get.log('⚠️ Cannot emit "$event" — Not connected.');
    }
  }

  void emitFile(String event, Map<String, dynamic> data) {
    emitEvent(event, data); // Reuse emitEvent
  }

  void listenToEvent(String event, Function(dynamic) callback) {
    if (_socket == null) {
      Get.log('⚠️ Socket not initialized. Cannot listen to "$event".');
      return;
    }

    if (_listeners.containsKey(event)) {
      Get.log('ℹ️ Updating existing listener for: $event');
      _socket!.off(event); // Remove previous
    }

    _listeners[event] = callback;
    _socket!.on(event, callback);
    Get.log('👂 Listening to event: $event');
  }

  void removeEventListener(String event) {
    if (_socket != null && _listeners.containsKey(event)) {
      _socket!.off(event);
      _listeners.remove(event);
      Get.log('🧹 Removed listener for: $event');
    }
  }

  void _cleanupSocket() {
    if (_socket != null) {
      _listeners.forEach((event, _) => _socket!.off(event));
      _listeners.clear();
      _socket!.disconnect();
      _socket = null;
      _updateConnectionStatus(false);
    }
  }

  void disconnect() {
    _cleanupSocket();
    Get.log('🔌 Socket manually disconnected');
  }

  void _updateConnectionStatus(bool connected) {
    isConnected.value = connected;
    connectionId.value = connected ? (_socket?.id ?? '') : '';
  }
}
