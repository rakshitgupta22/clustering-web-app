// functions to get the uploaded file from the form
function getDataFromTextArea(textId) {
  const data = document.getElementById(textId).value;
  // check if data is entered in textarea
  if (!data) {
    alert("Please enter data or upload a file");
    return;
  }
  // check if data is in correct format
  const lines = data.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].split("\t");
    if (line.length != 2) {
      alert("Please enter data in correct format");
      return;
    }
  }
  // create a file from the data
  const blob = new Blob([data], { type: "text/plain" });
  return new File([blob], "data.txt");
}

function getTrainData() {
  // Get data from file if uploaded or from textarea if entered manually
  var file = document.getElementById("modelData").files[0];

  // if file is not uploaded, get data from textarea
  if (!file) {
    file = getDataFromTextArea("textDataTrain");
  }
  // check the format of file (should be a tab separated txt file)
  if (file.name.split(".").pop() != "txt") {
    alert("Please upload a .txt file");
    return;
  }
  return file;
}

function getTestData() {
  var file = document.getElementById("testData").files[0];

  // if file is not uploaded, get data from textarea
  if (!file) {
    file = getDataFromTextArea("textDataTest");
  }

  // check the format of file (should be a tab separated txt file)
  if (file.name.split(".").pop() != "txt") {
    alert("Please upload a .txt file");
    return;
  }
  return file;
}

// function to send the train form data to the server
async function sendTrainingData(user) {
  const modelName = document.getElementById("modelName").value;
  const trainError = document.getElementById("trainingError");
  const kvalue = document.getElementById("kValue").value;
  trainError.innerHTML = "";
  const trainFile = getTrainData();

  if (!trainFile) return;

  // send to server
  const formData = new FormData();
  formData.append("modelName", modelName);
  formData.append("trainFile", trainFile);
  formData.append("user", user);
  formData.append("kvalue", kvalue);
  const trainSubmitBtn = document.querySelector(".train-button");
  trainSubmitBtn.disabled = true;
  trainSubmitBtn.innerHTML = "Training...";
  const fetchResponse = await fetch(`/train`, {
    method: "POST",
    body: formData,
  });

  if (fetchResponse.ok) {
    const data = await fetchResponse.json();
    trainSubmitBtn.disabled = false;
    trainSubmitBtn.innerHTML = "Train";
    // display the graph image from imageSrc key in data
    const trainGraphDiv = document.getElementById("training-display-graph");
    trainGraphDiv.innerHTML = `<img src="${data.imageSrc}" alt="Training Graph" />`;
    const response = await fetch(`/models/${user}`);

    if (response.ok) {
      const models = await response.json();
      // Display the model names on the dashboard
      displayModelNames(models);
    } else {
      console.log("No Models Found for user " + user);
    }
  } else {
    const { message } = await fetchResponse.json();
    trainError.innerHTML = message;
    trainSubmitBtn.disabled = false;
    trainSubmitBtn.innerHTML = "Train";
  }
}

// function to send the test form data to the server
async function sendTestingData(user) {
  const modelName = document.getElementById("modelSelect").value;
  const testError = document.getElementById("testingError");
  testError.innerHTML = "";
  const testFile = getTestData();

  if (!testFile) return;

  // send to server
  const formData = new FormData();
  formData.append("modelName", modelName);
  formData.append("testFile", testFile);
  formData.append("user", user);
  const testSubmitBtn = document.querySelector(".test-button");
  testSubmitBtn.disabled = true;
  testSubmitBtn.innerHTML = "Testing...";
  const fetchResponse = await fetch(`/test`, {
    method: "POST",
    body: formData,
  });

  if (fetchResponse.ok) {
    const data = await fetchResponse.json();
    testSubmitBtn.disabled = false;
    testSubmitBtn.innerHTML = "Test";
    // display the graph image from imageSrc key in data
    const testGraphDiv = document.getElementById("testing-display-graph");
    testGraphDiv.innerHTML = `<img src="${data.imageSrc}" alt="Testing Graph" />`;
  } else {
    const { message } = await fetchResponse.json();
    testError.innerHTML = message;
    testSubmitBtn.disabled = false;
    testSubmitBtn.innerHTML = "Test";
  }
}

// function to render the model names on the dashboard
function displayModelNames(models) {
  const modelList = document.getElementById("modelSelect");
  modelList.innerHTML = "<option value=''>Select</option>";
  models.forEach((model) => {
    const html = `<option value="${model.modelName}">${model.modelName}</option>`;
    modelList.insertAdjacentHTML("beforeend", html);
  });
}

// function to logout the user
function logout() {
  window.localStorage.removeItem("token");
  window.location.href = "/";
}

window.addEventListener("DOMContentLoaded", async () => {
  const token = window.localStorage.getItem("token");
  if (token) {
    const sessionResponse = await fetch(`/session/${token}`);
    if (sessionResponse.ok) {
      const { username } = await sessionResponse.json();
      // Print user's name on the dashboard
      const header = document.querySelector(".header");
      header.innerHTML = `Hi ${username}!`;

      // Get the model names from the database
      const response = await fetch(`/models/${username}`);

      if (response.ok) {
        const models = await response.json();
        // Display the model names on the dashboard
        displayModelNames(models);
      } else {
        console.log("No Models Found for user " + username);
      }

      // Add event listener to the train form
      const trainSubmitBtn = document.querySelector(".train-button");
      trainSubmitBtn.addEventListener("click", () => {
        sendTrainingData(username);
      });
      const trainForm = document.getElementById("trainingForm");
      trainForm.addEventListener("submit", (e) => {
        e.preventDefault();
        sendTrainingData(username);
      });

      // Add event listener to the test form
      const testSubmitBtn = document.querySelector(".test-button");
      testSubmitBtn.addEventListener("click", () => {
        sendTestingData(username);
      });
    } else {
      console.log("Session expired");
      window.location.href = "/";
      window.localStorage.removeItem("token");
    }

    const logoutBtn = document.querySelector(".logout-btn");
    logoutBtn.addEventListener("click", logout);
  }
});
