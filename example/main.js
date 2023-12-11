import MckD from "../src/Mckd.js";

const markdownDisplay = document.querySelector("#markdown-display");
const markdownDisplayDoc = markdownDisplay.contentDocument || markdownDisplay.contentWindow.document;
const markdownBody = markdownDisplayDoc.body;
const markdownInput = document.querySelector("#markdown-input");
const markdownInterprater = new MckD();

markdownInput.oninput = () => {
    markdownDisplayDoc.body.innerHTML = markdownInterprater.interprate(markdownInput.value);
}

window.onload = () => {
    markdownDisplayDoc.body.innerHTML = markdownInterprater.interprate(markdownInput.value);
}