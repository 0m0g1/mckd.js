import MckD from "../src/Mckd.js";

const markdownInput = document.querySelector("#markdown-input");
const markdownInterprater = new MckD({"element": ".markdown-display"});

function fetchContent() {
    
}


markdownInput.oninput = () => {
    markdownInterprater.interprate(markdownInput.value);
}

window.onload = () => {
   markdownInterprater.interprate(markdownInput.value);
}