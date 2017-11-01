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

    //Create an options object that contains the time to live for the notification and the priority
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    };


    return admin.messaging().sendToTopic("pushNotifications", payload, options);
});

exports.pushNovaMensagem = functions.database.ref('/mensagens/{idosoId}/{mensagemId}').onWrite( event => {
    
    console.log('Push new message event triggered');

    const mensagem = event.data.val();

    // Create a data payload
    const payload = {
        data: {
            id: mensagem.id, 
            destinatarioId: mensagem.destinatarioId,
            emissorId: mensagem.emissorId,
            fileName: mensagem.fileName
        },
    };
    
    //Create an options object that contains the time to live for the notification and the priority
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    };

    return admin.messaging().sendToTopic(mensagem.destinatarioId, payload, options);
});