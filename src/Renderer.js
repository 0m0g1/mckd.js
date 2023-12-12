import Lexer from "./lexer.js";
import Parser from "./parser.js";
import tokenTypes from "./tokens.js";

class Renderer {
    renderUl(token) {
        const listItems = token.value;
        let listString = "";

        for (const item of listItems) {
            listString += `<li>${item}</li>`;
        }

        return `<ul>${listString}</ul>`
    }
    renderOl(token) {
        const listItems = token.value;
        let listString = "";

        for (const item of listItems) {
            listString += `<li>${item}</li>`;
        }

        return `<ol start="${token.otherKeys.start}">${listString}</ol>`
    }
    renderImg(token) {
        return `<img alt="${token.otherKeys.altText}" src="${token.value}" title="${token.otherKeys.optionalTitle}">`
    }
    renderBlockquote(token) {
        return `<blockquote>${token.value}</blockquote>`
    }
    renderheader(token) {
        return `<${token.type}>${token.value}</${token.type}>`
    }
    renderString(token) {
        return `<p>${token.value}</p>`
    }
    renderScript(token) {
        return `<script>${token.value}</script>`
    }
    render(tokens) {
        let renderedString = "";

        if (tokens.length === 0) return "";

        for (const token of tokens) {
            if (token.rootType == tokenTypes.header) {
                renderedString += this.renderheader(token);

            } else if (token.type == tokenTypes.string) {
                renderedString += this.renderString(token);

            } else if (token.type == tokenTypes.newline) {
                renderedString += "<br>";

            } else if (token.type == tokenTypes.ul) {
                renderedString += this.renderUl(token);

            } else if (token.type == tokenTypes.ol) {
                renderedString += this.renderOl(token);
                
            } else if (token.type == tokenTypes.hr) {
                renderedString += "<hr>";

            } else if (token.type == tokenTypes.blockquote) {
                renderedString += this.renderBlockquote(token);

            } else if (token.type == tokenTypes.img) {
                renderedString += this.renderImg(token);
                
            } else if (token.type == tokenTypes.script) {
                renderedString += this.renderScript(token);

            }
        }

        return renderedString;
    }
    Render(input) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const tokens = parser.parse();
        return this.render(tokens);
    }
}

export default Renderer;