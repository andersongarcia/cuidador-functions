// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /chat/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {
    // Grab the text parameter.
    const original = req.query.text;
    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    admin.database().ref('/mensagens').push({original: original}).then(snapshot => {
      // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
      res.redirect(303, snapshot.ref);
    });
  });

  // Listens for new messages added to messages/:pushId
exports.pushNotification = functions.database.ref('/messages/{pushId}').onWrite( event => {
    
    console.log('Push notification event triggered');

    //  Grab the current value of what was written to the Realtime Database.
    var valueObject = event.data.val();

    if(valueObject.photoUrl != null) {
        valueObject.photoUrl= "Sent you a photo!";
    }

    // Create a notification
    const payload = {
        notification: {
            title:valueObject.name,
            body: valueObject.text || valueObject.photoUrl,
            sound: "default"
        },
    };

    // Cria um objeto de opções que contém o tempo em que a notificação ficará disponível e sua prioridade
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    };


    return admin.messaging().sendToTopic("pushNotifications", payload, options);
});

// Envia nova mensagem para destinarário, com link para áudio
exports.pushNovaMensagem = functions.database.ref('/mensagens/{idosoId}/{mensagemId}').onWrite( event => {
    
    console.log('Push new message event triggered');

    const mensagem = event.data.val();

    // Cria um payload de dados
    const payload = {
        data: {
            label: 'mensagem',  // identifica destino da mensagem
            id: mensagem.id, 
            destinatarioId: mensagem.destinatarioId,
            emissorId: mensagem.emissorId,
            fotoUri: mensagem.fotoUri,
            audioUri: mensagem.audioUri
        },
    };
    
    // Cria um objeto de opções que contém o tempo em que a notificação ficará disponível e sua prioridade
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    };

    return admin.messaging().sendToTopic(mensagem.destinatarioId, payload, options);
});

// Envia solicitação de sincronização dos remédios 
exports.pushSyncRemedios = functions.database.ref('/remedios/{idosoId}').onWrite( event => {

    console.log('Push sync Remedios event triggered');
    
    const idosoId = event.params.idosoId;

    // Cria um payload de dados
    const payload = {
        data: {
            label: 'remedios',   // identifica destino da mensagem
        },
    };
    
    // Cria um objeto de opções que contém o tempo em que a notificação ficará disponível e sua prioridade
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    };

    return admin.messaging().sendToTopic(idosoId, payload, options);
});


// Envia solicitação de sincronização dos remédios 
exports.pushSyncProgramas = functions.database.ref('/programas/{idosoId}').onWrite( event => {
    
    console.log('Push sync Programas event triggered');
    
    const idosoId = event.params.idosoId;

    // Cria um payload de dados
    const payload = {
        data: {
            label: 'programas',   // identifica destino da mensagem
        },
    };
    
    // Cria um objeto de opções que contém o tempo em que a notificação ficará disponível e sua prioridade
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    };

    return admin.messaging().sendToTopic(idosoId, payload, options);
});

// Envia notificação de administração do remédio para o cuidador
exports.pushNotificaCuidadorRemedio = functions.database.ref('/alertaRemedio/{idosoId}/{remedioId}').onWrite( event => {

    console.log('Push send notification CuidadorRemedio event triggered');
    
    const idosoId = event.params.idosoId;
    const remedioId = event.params.remedioId;

    // Cria um objeto de opções que contém o tempo em que a notificação ficará disponível e sua prioridade
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    };

    admin.database().ref('remedios/' + idosoId + '/' + remedioId).once('value', (snapshot) => {
        var remedio = snapshot.val();
        console.log('Remédio: ' + remedio);
        admin.database().ref('contatos/' + idosoId).once('value', (idosoSnapshot) => {
            var idoso = idosoSnapshot.val();
            admin.database().ref('idosos/' + idosoId + '/cuidadores').once('value', (cuidadoresSnapshot) => {
                var cuidadores = [];
                cuidadoresSnapshot.forEach(function(child) {
                    console.log(child);
                    cuidadores.push("'" + child.key + "' in topics");
                });
                var condition = cuidadores.join(" || ");

                // Cria um payload de dados
                const payload = {
                    data: {
                        label: 'alertaRemedio',   // identifica destino da mensagem
                        remedio: remedio,
                        idoso: idoso
                    },
                };

                return admin.messaging().sendToCondition(condition, payload, options);
            });
        });
    });
});