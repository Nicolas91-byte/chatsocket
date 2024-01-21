const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Registro de usuarios conectados
let usuariosConectados = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Solicitar y asignar un nombre de usuario desde el formulario
    socket.on('set username', (username) => {
        // Verificar si el usuario ya existe
        const usuarioExistente = obtenerUsuarioPorNombre(username);

        if (usuarioExistente) {
            // Si el nombre de usuario ya existe, enviar un mensaje al cliente para manejarlo
            socket.emit('nombre de usuario existente');
        } else {
            // Si el nombre de usuario es único, actualizar el nombre de usuario para el socket
            socket.username = username;

            // Agregar el usuario al registro
            const usuario = { socketId: socket.id, username: username };
            usuariosConectados.push(usuario);

            // Emitir la lista actualizada de usuarios conectados, incluyendo el nombre de usuario
            io.emit('usuarios conectados', obtenerNombresUsuarios());

            // Emitir evento 'username valid' para indicar que el nombre es válido
            socket.emit('username valid');
        }
    });

    // Resto del código del servidor...

    socket.on('chat message', (msg) => {
        // Emitir el mensaje solo a los usuarios conectados
        io.emit('chat message', { msg: msg, from: socket.username, to: null });
    });

    socket.on('private message', (data) => {
        const sender = obtenerUsuarioPorId(socket.id);
        const recipient = obtenerUsuarioPorNombre(data.to);

        if (sender && recipient) {
            socket.to(recipient.socketId).emit('private message', {
                msg: data.msg,
                from: sender.username,
                to: recipient.username
            });
            socket.emit('private message', {
                msg: data.msg,
                from: sender.username,
                to: recipient.username
            });
        }
    });

    socket.on('disconnect', () => {
        // Eliminar al usuario del registro cuando se desconecte
        eliminarUsuario(socket.id);

        // Notificar a todos los usuarios sobre el cambio en la lista de conectados
        io.emit('usuarios conectados', obtenerNombresUsuarios());
    });
});

http.listen(3000, () => {
    console.log('Escuchando en el puerto 3000');
});

// Funciones del servidor
function obtenerUsuarioPorId(socketId) {
    return usuariosConectados.find(usuario => usuario.socketId === socketId);
}

function obtenerUsuarioPorNombre(username) {
    return usuariosConectados.find(usuario => usuario.username === username);
}

function obtenerNombresUsuarios() {
    return usuariosConectados.map(usuario => usuario.username);
}

function eliminarUsuario(socketId) {
    const index = usuariosConectados.findIndex(usuario => usuario.socketId === socketId);
    if (index !== -1) {
        usuariosConectados.splice(index, 1);
    }
}
