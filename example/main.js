import MckD from "../src/MckD.js";

const markdownInput = document.querySelector("#markdown-input");
const markdownInterprater = new MckD({"element": ".markdown-display"});

async function fetchContent() {
    let textData = (await fetch("./example/text.md")).text();
    return textData;
}


markdownInput.oninput = () => {
    markdownInterprater.render(markdownInput.value);
}

window.onload = async () => {
    const content = await fetchContent();
    if (content) {
        markdownInput.value = content;
        markdownInterprater.render(markdownInput.value);
    } else {
        throw("There was an error fetching text.md")
    }
}