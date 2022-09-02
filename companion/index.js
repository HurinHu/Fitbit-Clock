import * as messaging from "messaging";

function updateData(data) {
  let url = "https://<url>/api/data?data="+escape(`Doris|${data}`);
  fetch(url)
  .then(function (response) {
    //console.log(`Response from server: ${response.text()}`);
  })
  .catch(function (err) {
    //console.error(`Error fetching HR: ${err}`);
  });
}

messaging.peerSocket.addEventListener("message", (evt) => {
    //console.log('From companion '+evt.data.command);
    try{
      updateData(evt.data.command);
    } catch (error) {

    }
});
  
messaging.peerSocket.addEventListener("error", (err) => {
    //console.error(`Connection error: ${err.code} - ${err.message}`);
});