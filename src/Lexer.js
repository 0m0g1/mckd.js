import Token from "./Token.js";
import tokenTypes from "./tokens.js";

function isSeriesOfCharacter(str, character) {
    const regex = new RegExp(`^${character}+$`);
    return regex.test(str);
}

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

        if (currentToken == "|") {
            return this.getTableToken();
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

            } else if (currentToken == "`") {
                string += this.getCodeToken();

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
                    const links${urlText} = document.querySelectorAll(".${urlText}link");

                    for (const link of links${urlText}) {
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

            return `<a href="${token.value}">${token.otherKeys.urlText}</a>`;
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
                return this.getStringToken("!").value;
            }
            
            this.currentPositionOnInput++;
            const altText = this.getStringToken("", "]").value;
            currentToken = this.input[this.currentPositionOnInput];
            
            if (currentToken != "]") {
                return this.getStringToken(`![${altText}`).value;
            }
            
            this.currentPositionOnInput++;
            currentToken = this.input[this.currentPositionOnInput];
            
            if (currentToken != "(") {
                return this.getStringToken(`![${altText}]`).value;
            }
            
            this.currentPositionOnInput++;
            const imgUrl = this.getStringToken("", ")").value;
            currentToken = this.input[this.currentPositionOnInput];
            let optionalTitle = "";

            if (currentToken == " ") {
                this.currentPositionOnInput++;
                currentToken = this.input[this.currentPositionOnInput];

                if (currentToken != '"') {
                    return this.getStringToken(`![${altText}](${imgUrl} `).value
                }
                
                this.currentPositionOnInput++;

                optionalTitle = this.getStringToken("", '"');
                currentToken = this.input[this.currentPositionOnInput];
                
                if (currentToken != '"') {
                    return this.getStringToken(`![${altText}](${imgUrl} "`).value
                }
                
                this.currentPositionOnInput++;
            }
            
            currentToken = this.input[this.currentPositionOnInput];

            if (currentToken != ")") {
                if (altText == "") {
                    return this.getStringToken(`![${altText}](${imgUrl} "${altText}"`).value;
                }
                return this.getStringToken(`![${altText}](${imgUrl}`).value;
            }
            
            this.currentPositionOnInput++;
            return `<img src="${imgUrl}" alt="${altText} title="${optionalTitle}">`
        }
    }
    getCodeToken() {
        let currentToken = this.input[this.currentPositionOnInput];
        let noOfBackTicks = 0;
    
        // Count the number of backticks
        while (this.input[this.currentPositionOnInput] === "`" && this.currentPositionOnInput < this.input.length) {
            noOfBackTicks++;
            this.currentPositionOnInput++;
        }
    
        if (noOfBackTicks < 3) {
            let code = this.getStringToken("", "`").value;
    
            // If code doesn't end with a backtick, return the string enclosed by backticks
            if (this.input[this.currentPositionOnInput] !== "`") {
                return `${"`".repeat(noOfBackTicks)}${code}`;
            }
    
            // Move past the closing backticks
            while (this.input[this.currentPositionOnInput] === "`") {
                noOfBackTicks--;
                this.currentPositionOnInput++;
            }
    
            // Handle the scenarios based on the remaining number of backticks
            if (noOfBackTicks < 0) {
                return `<code class="inline-code">${code}</code>${"`".repeat(noOfBackTicks * -1)}`;
            }
    
            return `${"`".repeat(noOfBackTicks)}<code class="inline-code">${code}</code>`;
        }
    
        if (noOfBackTicks === 3) {
            let language = this.getStringToken().value.toLowerCase();
            let code = "";
            
            this.currentPositionOnInput++;
            while (this.currentPositionOnInput < this.input.length) {
                if (this.input.slice(this.currentPositionOnInput, this.currentPositionOnInput + 3) === "```" &&
                    (/[\n\r]/.test(this.input[this.currentPositionOnInput + 3])) || this.currentPositionOnInput + 3 >= this.input.length) {
                    this.currentPositionOnInput += 3;
                    return `<pre><code class="language-${language}">${code}</code></pre>`;
                }

                code += this.input[this.currentPositionOnInput]
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("&", "&amp;");
                this.currentPositionOnInput++;
        
                // Check for the end of input before reaching the closing triple backticks
                if (this.currentPositionOnInput >= this.input.length) {
                    return `<pre><code class="language-${language}">${code}</code></pre>`;
                }
            }
        }
        
    
        // If it's not a code block or inline code, return the backticks
        return "`".repeat(noOfBackTicks);
    }
    getTableToken() {
        let table = "<table>\n";
        let row = [];
        let cellContent = "";
        let isHeaderRow = true;
    
        while (this.currentPositionOnInput < this.input.length) {
            let currentToken = this.input[this.currentPositionOnInput];
    
            if (/[\n\r]/.test(currentToken) && this.input[this.currentPositionOnInput + 1] != "|") {
                break;
            }

            if (currentToken === "|" || /[\n\r]/.test(currentToken) ) {

                if (cellContent.trim() !== "") {
                    row.push(cellContent.trim());
                    cellContent = "";
                }
    
                if (currentToken === "|" && (this.currentPositionOnInput === this.input.length - 1 || this.input[this.currentPositionOnInput + 1] === "\n")) {
                    row.push(""); // Add empty cell for last pipe in the row
                }
    
                if (/[\n\r]/.test(currentToken)) {
                    if (isHeaderRow) {
                        table += "  <thead>\n";
                    }
                    table += "  <tr>\n";
                    const rowType = isHeaderRow ? "th" : "td";
                    for (let cell of row) {
                        table += `    <${rowType}>${cell}</${rowType}>\n`;
                    }
                    table += "  </tr>\n";
                    if (isHeaderRow) {
                        table += "  </thead>\n";
                        table += "  <tbody>\n";
                        isHeaderRow = false;
                    }
                    row = [];
                }
            } else {
                cellContent += currentToken;
            }

            this.currentPositionOnInput++;
        }
    
        // Push the last row's content if any
        if (row.length > 0) {
            table += "  <tr>\n";
            for (let cell of row) {
                table += `    <td>${cell}</td>\n`;
            }
            table += "  </tr>\n";
        }
    
        table += "  </tbody>\n";
        table += "</table>";
    
        // Check for tokens after the table
        while (/\s/.test(this.input[this.currentPositionOnInput]) && this.currentPositionOnInput < this.input.length) {
            this.currentPositionOnInput++;
        }
    
        return new Token(tokenTypes.table, table);
    }
}

export default Lexer;