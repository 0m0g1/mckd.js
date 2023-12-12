import Token from "./token.js";
import tokenTypes from "./tokens.js";

class Lexer {
    constructor(input) {
        this.input = input;
        this.currentPositionOnInput = -1;
    }
    getNextToken() {
        if (this.currentPositionOnInput >= this.input.length) {
            return new Token(tokenTypes.eoi);
        }

        let currentToken = this.input[this.currentPositionOnInput];

        if (/[\n\r]/.test(currentToken) || this.currentPositionOnInput == -1) {
            this.currentPositionOnInput++;
            return new Token(tokenTypes.newline);
        }

        if (currentToken === "#") { // Check if a sequence of hashes is a string or a header
            let noOfHashes = 0;
            
            while (this.input[this.currentPositionOnInput] == "#" && this.currentPositionOnInput < this.input.length) {
                noOfHashes++;
                this.currentPositionOnInput++;
            }
            
            if (this.input[this.currentPositionOnInput] === " " && noOfHashes < 7 && this.currentPositionOnInput < this.input.length - 1) {
                this.currentPositionOnInput++;
                return new Token (tokenTypes.header, noOfHashes);
            }
            
            return this.getStringToken("#".repeat(noOfHashes));
        }

        if (currentToken == "=") {
            let noOfEquals = "";
            while (this.input[this.currentPositionOnInput] == "=" && this.currentPositionOnInput < this.input.length) {
                noOfEquals += "=";
                this.currentPositionOnInput++;
            }
            
            
            if (this.currentPositionOnInput >= this.input.length) {
                this.currentPositionOnInput++;
                return new Token(tokenTypes.equal, noOfEquals); 
            }
            
            currentToken = this.input[this.currentPositionOnInput];

            if (/[\n\r]/.test(this.input[this.currentPositionOnInput])) {
                return new Token(tokenTypes.equal, noOfEquals); 
            }
            
            return this.getStringToken(noOfEquals);
        }

        if (currentToken == "-") {
            let noOfDashes = 0;
            while (this.input[this.currentPositionOnInput] == "-" && this.currentPositionOnInput < this.input.length) {
                noOfDashes++;
                this.currentPositionOnInput++;
            }

            currentToken = this.input[this.currentPositionOnInput];

            if (currentToken === " ") {
                this.currentPositionOnInput++;

                if (/[\n\r]/.test(this.input[this.currentPositionOnInput]) || this.currentPositionOnInput >= this.input.length) {
                    return this.getStringToken(`${"-".repeat(noOfDashes)} `);
                }

                if (noOfDashes === 1) {
                    return new Token(tokenTypes.ul);
                }

                return this.getStringToken(`${"-".repeat(noOfDashes)} `);
            }

            if (/[\n\r]/.test(currentToken) || this.currentPositionOnInput >= this.input.length) {
                if (noOfDashes >= 1) {
                    this.currentPositionOnInput++;
                    return new Token(tokenTypes.dash, noOfDashes)
                }
            }

            return this.getStringToken("-".repeat(noOfDashes));
        }

        if (/[0-9]/.test(currentToken)) {
            let digit = 0;
            while (/[0-9]/.test(this.input[this.currentPositionOnInput]) && this.currentPositionOnInput < this.input.length) {
                digit = (digit * 10) + parseInt(this.input[this.currentPositionOnInput]);
                this.currentPositionOnInput++;
            }

            currentToken = this.input[this.currentPositionOnInput];

            if (currentToken == ".") {
                if (this.input[this.currentPositionOnInput + 1] == " ") {
                    this.currentPositionOnInput += 2;
                    const olToken = new Token(tokenTypes.ol);
                    olToken.otherKeys.start = digit;
                    return olToken;
                }
            } 

            return this.getStringToken(`${digit}`);
        }

        if (currentToken === ">") {
            if (this.currentPositionOnInput + 1 >= this.input.length || this.currentPositionOnInput + 2 >= this.input.length) {
                this.currentPositionOnInput++;
                return this.getStringToken(">");
            }
            if (this.input[this.currentPositionOnInput + 1] == " " && !(/[\n\r]/.test(this.input[this.currentPositionOnInput + 2]))) {
                this.currentPositionOnInput += 2;
                return new Token(tokenTypes.blockquote)  
            }
        }

        if (!/[\n\r]/.test(currentToken)) {
            return this.getStringToken();
        }
    }
    getStringToken(previouseString = "", stoppingDelimiter = null) {
        let string = previouseString;

        while (/[^\n\r]+/.test(this.input[this.currentPositionOnInput]) && this.currentPositionOnInput < this.input.length) {
            let currentToken = this.input[this.currentPositionOnInput];

            if (currentToken == "[") {
                const link = this.getLinkToken();

                if (link.type === tokenTypes.script) {
                    return link;
                }
                
                string += link;

            } else if (currentToken == "!") {
                const image = this.getImageToken();

                if (image.type === tokenTypes.img) {
                    return image;
                }

                string += image;

            } else if (currentToken == "*") {
                string += this.getStarredBoldOrItalic();

            } else if (currentToken == "_") {
                string += this.getUnderScoredBoldOrItalic();

            } else {
                string += this.input[this.currentPositionOnInput];
                this.currentPositionOnInput++;
            }

            if (this.input[this.currentPositionOnInput] == stoppingDelimiter) {
                break;
            }
        }

        return new Token(tokenTypes.string, string);
    }
    getLinkToken() {
        let currentToken = this.input[this.currentPositionOnInput];

        if (currentToken == "[") {
            this.currentPositionOnInput++;
            currentToken = this.input[this.currentPositionOnInput];

            const urlText = this.getStringToken("", "]").value;

            if (this.input[this.currentPositionOnInput] != "]") {
                return `[${urlText}`;
            } 
            
            this.currentPositionOnInput++;
            currentToken = this.input[this.currentPositionOnInput];
            
            if (currentToken == ":") {
                this.currentPositionOnInput++;
                currentToken = this.input[this.currentPositionOnInput];

                if (currentToken == " ") {
                    this.currentPositionOnInput++;
                    currentToken = this.input[this.currentPositionOnInput];
                }

                const url = this.getStringToken().value;

                const script = `
                    const links = document.querySelectorAll(".${urlText}link");

                    for (const link of links) {
                        link.href = "${url}"
                    }
                `
                return new Token(tokenTypes.script, script);
            }
            
            if (currentToken != "(") {
                return `<a class="${urlText}link">${urlText}</a>`;
            }
            
            this.currentPositionOnInput++;
            const url = this.getStringToken("", ")").value;
            
            currentToken = this.input[this.currentPositionOnInput];

            if (currentToken !== ")") {
                if (this.input[this.currentPositionOnInput - 1] !== ")"){
                    return `[${urlText}](${url}`;
                }
            }

            this.currentPositionOnInput++;

            const token = new Token(tokenTypes.link, url, null, {urlText: urlText});

            return `<a href="${token.value}" target="_blank">${token.otherKeys.urlText}</a>`;
        }
    }
    getStarredBoldOrItalic() {
        let currentToken = this.input[this.currentPositionOnInput];

        if (currentToken == "*") {
            this.currentPositionOnInput++;
            currentToken = this.input[this.currentPositionOnInput];
            
            if (currentToken != "*") {
                const italicText = this.getStringToken("", "*").value;

                currentToken = this.input[this.currentPositionOnInput];

                if (currentToken != "*") {
                    return `*${italicText}`;
                }

                this.currentPositionOnInput++;
                return` <i>${italicText}</i>`;
            }
            
            this.currentPositionOnInput++;
            const boldText = this.getStringToken("", "*").value;
            currentToken = this.input[this.currentPositionOnInput];
            
            if (currentToken != "*") {
                return `**${boldText}`;
            }
            
            this.currentPositionOnInput++;
            currentToken = this.input[this.currentPositionOnInput];

            if (currentToken != "*") {
                return `*<i>${boldText}</i>`;
            }

            this.currentPositionOnInput++;
            return` <b>${boldText}</b>`;
        }
    }
    getUnderScoredBoldOrItalic() {
        let currentToken = this.input[this.currentPositionOnInput];

        if (currentToken == "_") {
            this.currentPositionOnInput++;
            currentToken = this.input[this.currentPositionOnInput];
            
            if (currentToken != "_") {
                const italicText = this.getStringToken("", "_").value;

                currentToken = this.input[this.currentPositionOnInput];

                if (currentToken != "_") {
                    return `_${italicText}`;
                }

                this.currentPositionOnInput++;
                return` <i>${italicText}</i>`;
            }
            
            this.currentPositionOnInput++;
            const boldText = this.getStringToken("", "_").value;
            currentToken = this.input[this.currentPositionOnInput];
            
            if (currentToken != "_") {
                return `__${boldText}`;
            }
            
            this.currentPositionOnInput++;
            currentToken = this.input[this.currentPositionOnInput];

            if (currentToken != "_") {
                return `_<i>${boldText}</i>`;
            }

            this.currentPositionOnInput++;
            return` <b>${boldText}</b>`;
        }
    }
    getImageToken() {
        let currentToken = this.input[this.currentPositionOnInput];

        if (currentToken == "!") {
            this.currentPositionOnInput++;
            currentToken = this.input[this.currentPositionOnInput];
            
            if (currentToken != "[") {
                return this.getStringToken("!");
            }
            
            this.currentPositionOnInput++;
            const altText = this.getStringToken("", "]").value;
            currentToken = this.input[this.currentPositionOnInput];
            
            if (currentToken != "]") {
                return this.getStringToken("![");
            }
            
            this.currentPositionOnInput++;
            currentToken = this.input[this.currentPositionOnInput];
            
            if (currentToken != "(") {
                return this.getStringToken(`![${altText}]`);
            }
            
            this.currentPositionOnInput++;
            const imgUrl = this.getStringToken("", ")").value;
            currentToken = this.input[this.currentPositionOnInput];
            let optionalTitle = "";

            if (currentToken == " ") {
                this.currentPositionOnInput++;
                currentToken = this.input[this.currentPositionOnInput];

                if (currentToken != '"') {
                    return this.getStringToken(`![${altText}](${imgUrl} `)
                }
                
                this.currentPositionOnInput++;

                optionalTitle = this.getStringToken("", '"');
                currentToken = this.input[this.currentPositionOnInput];
                
                if (currentToken != '"') {
                    return this.getStringToken(`![${altText}](${imgUrl} "`)
                }
                
                this.currentPositionOnInput++;
            }
            
            currentToken = this.input[this.currentPositionOnInput];

            if (currentToken != ")") {
                if (altText == "") {
                    return this.getStringToken(`![${altText}](${imgUrl} "${altText}"`);
                }
                return this.getStringToken(`![${altText}](${imgUrl}`);
            }
            
            this.currentPositionOnInput++;
            return `<img src="${imgUrl}" alt="${altText} title="${optionalTitle}">`
        }
    }
}

export default Lexer;