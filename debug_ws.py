import socketio

sio = socketio.Client()

@sio.on('5g_state')
def on_state(data):
    print(data['aps'])
    sio.disconnect()

sio.connect('http://localhost:5001')
sio.wait()
