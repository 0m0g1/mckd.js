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

        const style = this.iframeDoc.createElement("style");
        style.textContent = `
            .inline-code {
                background-color: #efefef;
                padding: 0px 7px;
                font-size: 1.2em;
                color: #333;
            }
            // pre {
            //     background: #222222;
            //     color: whitesmoke;
            //     padding:0.5rem;
            // }
        `
        this.iframeDoc.head.appendChild(style);
        
        const highlightJsLink = this.iframeDoc.createElement("link");
        // highlightJsLink.setAttribute("href","https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/dark.css"); // dark mode
        highlightJsLink.setAttribute("href","https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css"); //light mode
        highlightJsLink.setAttribute("rel", "stylesheet");
        this.iframeDoc.head.appendChild(highlightJsLink);

        const highlightJsScript = this.iframeDoc.createElement("script");
        highlightJsScript.setAttribute("src", "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js");
        this.iframeDoc.head.appendChild(highlightJsScript);

        // this.iframeDoc.head.textContent += `
        //     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
        //     <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
        // `
    }
    removeScripts() {
        const scripts = this.iframeDoc.body.querySelectorAll("script");
        scripts.forEach((script) => {
            this.iframeBody.removeChild(script);
            const newScript = this.iframeDoc.createElement("script");
            newScript.text = script.textContent;
            this.iframeBody.appendChild(newScript);
            this.iframeBody.removeChild(newScript);
        });
        const newScript = this.iframeDoc.createElement("script");
        newScript.text = "hljs.highlightAll();";
        this.iframeBody.appendChild(newScript);
        this.iframeBody.removeChild(newScript);
    }
    render(text) {
        this.iframeBody.innerHTML = this.renderer.Render(text);
        this.removeScripts();
    }
    
}

export default MckD;