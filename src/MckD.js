import Renderer from "./Renderer.js";

class MckD {
    constructor(constructors = {"element": ""}) {
        this.element = document.querySelector(constructors.element);
        this.iframeDoc = null;
        this.iframeBody = null;
        this.renderer = new Renderer();
        this.createIframe();
    }
    createIframe() {
        const iframe = document.createElement("iframe");
        this.element.appendChild(iframe);
        
        this.iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        this.iframeBody = this.iframeDoc.body;
        iframe.style.height = "100%";
        iframe.style.width = "100%";

        const link = this.iframeDoc.createElement('link');

        link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap';
        link.rel = 'stylesheet';
        this.iframeDoc.head.appendChild(link);

        // Applying the Roboto font to the iframe body
        this.iframeDoc.body.style.fontFamily = 'Roboto, sans-serif';
    }
    removeScripts() {
        const scripts = this.iframeDoc.querySelectorAll("script");
        scripts.forEach((script) => {
            this.iframeBody.removeChild(script);
            const newScript = this.iframeDoc.createElement("script");
            newScript.text = script.textContent;
            this.iframeBody.appendChild(newScript);
            this.iframeBody.removeChild(newScript);
        });
    }
    interprate(text) {
        this.iframeBody.innerHTML = this.renderer.Render(text);
        this.removeScripts();
    }
    
}

export default MckD;